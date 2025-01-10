import WebSocket from 'ws';
import { Ship } from '../models/Ship.js';
import { createAlert } from './alertService.js';

class ShipTrackingService {
  constructor() {
    this.socket = null;
    this.API_KEY = process.env.AIS_API_KEY;
    this.connectedShips = new Map(); // Track connected ships by MMSI
  }

  start() {
    this.socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

    this.socket.addEventListener('open', () => {
      const subscriptionMessage = {
        APIkey: this.API_KEY,
        BoundingBoxes: [
          [
            [-180, -90],
            [180, 90],
          ],
        ],
        FilterMessageTypes: ['PositionReport'],
      };

      this.socket.send(JSON.stringify(subscriptionMessage));
      console.log('Connected to AIS stream');
    });

    this.socket.addEventListener('error', (error) => {
      console.error('AIS WebSocket error:', error);
      // Attempt to reconnect after a delay
      setTimeout(() => this.start(), 5000);
    });

    this.socket.addEventListener('message', async (event) => {
      try {
        const aisMessage = JSON.parse(event.data);
        if (aisMessage.MessageType === 'PositionReport') {
          await this.handlePositionReport(aisMessage.Message.PositionReport);
        }
      } catch (error) {
        console.error('Error processing AIS message:', error);
      }
    });

    this.socket.addEventListener('close', () => {
      console.log('AIS WebSocket connection closed');
      // Attempt to reconnect after a delay
      setTimeout(() => this.start(), 5000);
    });
  }

  async handlePositionReport(positionReport) {
    try {
      // Find ship by MMSI (Maritime Mobile Service Identity)
      const ship = await Ship.findOne({ 'aisData.mmsi': positionReport.UserID });
      
      if (ship) {
        const previousStatus = ship.status;
        await ship.updateAisData(positionReport);

        // Check for significant changes or anomalies
        await this.detectAnomalies(ship, previousStatus);
        
        // Update connected ships map
        this.connectedShips.set(positionReport.UserID, {
          lastUpdate: new Date(),
          location: [positionReport.Longitude, positionReport.Latitude]
        });
      }
    } catch (error) {
      console.error('Error handling position report:', error);
    }
  }

  async detectAnomalies(ship, previousStatus) {
    const currentTime = new Date();
    
    // Check for schedule deviation
    if (ship.dockingSchedule && ship.dockingSchedule.startTime) {
      const scheduledArrival = new Date(ship.dockingSchedule.startTime);
      const timeDiff = Math.abs(currentTime - scheduledArrival) / 36e5; // Convert to hours
      
      if (timeDiff > 2) { // More than 2 hours deviation
        await createAlert({
          type: 'ship_delay',
          severity: 'high',
          message: `Ship ${ship.name} is ${Math.round(timeDiff)} hours off schedule`,
          affectedAsset: ship.shipId
        });
      }
    }

    // Check for status changes
    if (previousStatus !== ship.status) {
      await createAlert({
        type: 'ship_status',
        severity: 'medium',
        message: `Ship ${ship.name} status changed from ${previousStatus} to ${ship.status}`,
        affectedAsset: ship.shipId
      });
    }

    // Check for unexpected stops
    if (ship.aisData.speedOverGround < 0.1 && ship.status === 'sailing') {
      await createAlert({
        type: 'ship_stopped',
        severity: 'medium',
        message: `Ship ${ship.name} has unexpectedly stopped while sailing`,
        affectedAsset: ship.shipId
      });
    }
  }

  stop() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Get all currently tracked ships
  getTrackedShips() {
    return Array.from(this.connectedShips.entries()).map(([mmsi, data]) => ({
      mmsi,
      ...data
    }));
  }
}

// Create singleton instance
const shipTrackingService = new ShipTrackingService();

export default shipTrackingService;
