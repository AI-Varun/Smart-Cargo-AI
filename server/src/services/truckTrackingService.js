import axios from 'axios';
import { Truck } from '../models/Truck.js';
import { createAlert } from './alertService.js';
import WebSocket from 'ws';
import Shipment from '../models/Shipment';
import plantLocationService from './plantLocationService';

class TruckTrackingService {
  constructor() {
    this.osrmUrl = process.env.OSRM_URL || 'http://router.project-osrm.org';
    this.activeRoutes = new Map(); // Track active routes by truckId
    this.simulationIntervals = new Map(); // Track simulation intervals
    this.trackingIntervals = new Map();
    this.wsClients = new Set();
    this.osrmBaseUrl = process.env.OSRM_BASE_URL || 'http://router.project-osrm.org';
  }

  setupWebSocket(wss) {
    wss.on('connection', (ws) => {
      this.wsClients.add(ws);
      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
    });
  }

  broadcastLocation(shipmentId, location) {
    const message = JSON.stringify({
      type: 'location_update',
      shipmentId,
      location
    });

    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async getRoute(origin, destination) {
    try {
      const response = await axios.get(
        `${this.osrmUrl}/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}`,
        {
          params: {
            overview: 'full',
            geometries: 'geojson',
            steps: true
          }
        }
      );

      if (response.data.code !== 'Ok') {
        throw new Error('Failed to get route from OSRM');
      }

      const route = response.data.routes[0];
      return {
        coordinates: route.geometry.coordinates,
        duration: route.duration,
        distance: route.distance,
        steps: route.legs[0].steps
      };
    } catch (error) {
      console.error('Error getting route from OSRM:', error);
      throw error;
    }
  }

  async startTracking(truckId, origin, destination) {
    try {
      const truck = await Truck.findOne({ truckId });
      if (!truck) {
        throw new Error('Truck not found');
      }

      // Get route from OSRM
      const route = await this.getRoute(origin, destination);
      
      // Store route information
      this.activeRoutes.set(truckId, {
        coordinates: route.coordinates,
        duration: route.duration,
        distance: route.distance,
        currentStep: 0,
        startTime: new Date()
      });

      // Start position simulation
      this.startSimulation(truckId);

      return route;
    } catch (error) {
      console.error('Error starting truck tracking:', error);
      throw error;
    }
  }

  async startTrackingShipment(shipmentId) {
    try {
      const shipment = await Shipment.findOne({ shipmentId }).populate('pickupLocation');
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      // Get route from OSRM
      const origin = {
        lon: shipment.pickupLocation.location.coordinates[0],
        lat: shipment.pickupLocation.location.coordinates[1]
      };
      const destination = {
        lon: shipment.deliveryLocation.coordinates.coordinates[0],
        lat: shipment.deliveryLocation.coordinates.coordinates[1]
      };

      const route = await plantLocationService.getRoute(origin, destination);
      const coordinates = route.routes[0].geometry.coordinates;
      
      // Update shipment with route
      await Shipment.findByIdAndUpdate(shipment._id, {
        route: {
          type: 'LineString',
          coordinates
        },
        status: 'in-transit',
        currentLocation: {
          type: 'Point',
          coordinates: coordinates[0]
        }
      });

      // Start simulating GPS pings along the route
      let currentPointIndex = 0;
      const interval = setInterval(async () => {
        if (currentPointIndex >= coordinates.length) {
          this.stopTrackingShipment(shipmentId);
          await Shipment.findByIdAndUpdate(shipment._id, {
            status: 'delivered',
            currentLocation: {
              type: 'Point',
              coordinates: coordinates[coordinates.length - 1]
            },
            actualDeliveryTime: new Date()
          });
          return;
        }

        const currentLocation = {
          type: 'Point',
          coordinates: coordinates[currentPointIndex]
        };

        await Shipment.findByIdAndUpdate(shipment._id, { currentLocation });
        this.broadcastLocation(shipmentId, currentLocation);
        
        currentPointIndex++;
      }, 10000); // Update every 10 seconds

      this.trackingIntervals.set(shipmentId, interval);
    } catch (error) {
      console.error('Error starting tracking:', error);
      throw error;
    }
  }

  startSimulation(truckId) {
    if (this.simulationIntervals.has(truckId)) {
      return; // Already simulating
    }

    const routeData = this.activeRoutes.get(truckId);
    if (!routeData) {
      return;
    }

    const updateInterval = Math.max(routeData.duration / 100, 10); // Update every 1% of total duration or 10 seconds
    let currentStep = 0;

    const intervalId = setInterval(async () => {
      try {
        const coordinates = routeData.coordinates[currentStep];
        if (!coordinates || currentStep >= routeData.coordinates.length) {
          this.stopTracking(truckId);
          return;
        }

        // Update truck position
        await this.updateTruckPosition(truckId, coordinates);

        // Check for delays and other anomalies
        await this.detectAnomalies(truckId, routeData, currentStep);

        currentStep++;
      } catch (error) {
        console.error('Error in simulation interval:', error);
      }
    }, updateInterval * 1000);

    this.simulationIntervals.set(truckId, intervalId);
  }

  async updateTruckPosition(truckId, coordinates) {
    try {
      const truck = await Truck.findOne({ truckId });
      if (!truck) {
        return;
      }

      truck.location.coordinates = coordinates;
      truck.lastUpdate = new Date();
      await truck.save();
    } catch (error) {
      console.error('Error updating truck position:', error);
    }
  }

  async detectAnomalies(truckId, routeData, currentStep) {
    try {
      const truck = await Truck.findOne({ truckId });
      if (!truck) {
        return;
      }

      const elapsedTime = (new Date() - routeData.startTime) / 1000;
      const expectedProgress = elapsedTime / routeData.duration;
      const actualProgress = currentStep / routeData.coordinates.length;

      // Check for significant delay (more than 20% behind schedule)
      if (actualProgress < expectedProgress - 0.2) {
        await createAlert({
          type: 'truck_delay',
          severity: 'high',
          message: `Truck ${truckId} is significantly behind schedule`,
          affectedAsset: truckId
        });
      }

      // Check for route deviation
      if (currentStep > 0) {
        const expectedCoord = routeData.coordinates[currentStep];
        const actualCoord = truck.location.coordinates;
        const deviation = this.calculateDistance(expectedCoord, actualCoord);

        if (deviation > 0.5) { // More than 0.5 km deviation
          await createAlert({
            type: 'route_deviation',
            severity: 'medium',
            message: `Truck ${truckId} has deviated from planned route`,
            affectedAsset: truckId
          });
        }
      }
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }
  }

  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2[1] - coord1[1]);
    const dLon = this.toRad(coord2[0] - coord1[0]);
    const lat1 = this.toRad(coord1[1]);
    const lat2 = this.toRad(coord2[1]);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }

  stopTracking(truckId) {
    const intervalId = this.simulationIntervals.get(truckId);
    if (intervalId) {
      clearInterval(intervalId);
      this.simulationIntervals.delete(truckId);
    }
    this.activeRoutes.delete(truckId);
  }

  stopTrackingShipment(shipmentId) {
    const interval = this.trackingIntervals.get(shipmentId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(shipmentId);
    }
  }

  // Get all currently tracked trucks
  getTrackedTrucks() {
    return Array.from(this.activeRoutes.keys());
  }

  // Get current route progress for a truck
  getRouteProgress(truckId) {
    const routeData = this.activeRoutes.get(truckId);
    if (!routeData) {
      return null;
    }

    const elapsedTime = (new Date() - routeData.startTime) / 1000;
    return {
      totalDistance: routeData.distance,
      totalDuration: routeData.duration,
      elapsedTime,
      progress: Math.min(elapsedTime / routeData.duration, 1)
    };
  }

  async getCurrentLocation(shipmentId) {
    try {
      const shipment = await Shipment.findOne({ shipmentId });
      return shipment ? shipment.currentLocation : null;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  async getShipmentRoute(shipmentId) {
    try {
      const shipment = await Shipment.findOne({ shipmentId });
      return shipment ? shipment.route : null;
    } catch (error) {
      console.error('Error getting shipment route:', error);
      throw error;
    }
  }
}

// Create singleton instance
const truckTrackingService = new TruckTrackingService();

export default truckTrackingService;
