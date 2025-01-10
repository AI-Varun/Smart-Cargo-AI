import { WebSocketServer } from 'ws';
import shipTrackingService from './shipTrackingService.js';
import truckTrackingService from './truckTrackingService.js';
import alertService from './alertService.js';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map to store client subscriptions
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');

      // Initialize client subscriptions
      this.clients.set(ws, {
        trucks: new Set(),
        ships: new Set(),
        alerts: {
          types: [],
          severity: [],
          assets: []
        }
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      // Send initial data
      this.sendInitialData(ws);
    });

    // Initialize alert service WebSocket
    alertService.initializeWebSocket(server);
  }

  async sendInitialData(ws) {
    try {
      // Send active trucks and ships
      const trucks = truckTrackingService.getTrackedTrucks();
      const ships = shipTrackingService.getTrackedShips();

      ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
          trucks,
          ships
        }
      }));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'subscribe_truck':
        this.handleTruckSubscription(ws, message.truckId);
        break;
      
      case 'unsubscribe_truck':
        this.handleTruckUnsubscription(ws, message.truckId);
        break;
      
      case 'subscribe_ship':
        this.handleShipSubscription(ws, message.shipId);
        break;
      
      case 'unsubscribe_ship':
        this.handleShipUnsubscription(ws, message.shipId);
        break;
      
      case 'get_route_progress':
        this.sendRouteProgress(ws, message.vehicleId, message.vehicleType);
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  handleTruckSubscription(ws, truckId) {
    const subscriptions = this.clients.get(ws);
    if (subscriptions) {
      subscriptions.trucks.add(truckId);
    }
  }

  handleTruckUnsubscription(ws, truckId) {
    const subscriptions = this.clients.get(ws);
    if (subscriptions) {
      subscriptions.trucks.delete(truckId);
    }
  }

  handleShipSubscription(ws, shipId) {
    const subscriptions = this.clients.get(ws);
    if (subscriptions) {
      subscriptions.ships.add(shipId);
    }
  }

  handleShipUnsubscription(ws, shipId) {
    const subscriptions = this.clients.get(ws);
    if (subscriptions) {
      subscriptions.ships.delete(shipId);
    }
  }

  async sendRouteProgress(ws, vehicleId, vehicleType) {
    try {
      let progress;
      if (vehicleType === 'truck') {
        progress = truckTrackingService.getRouteProgress(vehicleId);
      } else if (vehicleType === 'ship') {
        progress = shipTrackingService.getTrackedShips().find(s => s.mmsi === vehicleId);
      }

      if (progress) {
        ws.send(JSON.stringify({
          type: 'route_progress',
          vehicleId,
          vehicleType,
          data: progress
        }));
      }
    } catch (error) {
      console.error('Error sending route progress:', error);
    }
  }

  // Broadcast updates to subscribed clients
  broadcastTruckUpdate(truckId, data) {
    for (const [ws, subscriptions] of this.clients.entries()) {
      if (subscriptions.trucks.has(truckId)) {
        try {
          ws.send(JSON.stringify({
            type: 'truck_update',
            truckId,
            data
          }));
        } catch (error) {
          console.error('Error broadcasting truck update:', error);
          this.clients.delete(ws);
        }
      }
    }
  }

  broadcastShipUpdate(shipId, data) {
    for (const [ws, subscriptions] of this.clients.entries()) {
      if (subscriptions.ships.has(shipId)) {
        try {
          ws.send(JSON.stringify({
            type: 'ship_update',
            shipId,
            data
          }));
        } catch (error) {
          console.error('Error broadcasting ship update:', error);
          this.clients.delete(ws);
        }
      }
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
