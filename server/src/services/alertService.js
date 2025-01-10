import { Alert } from '../models/Alert.js';
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

class AlertService {
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.subscribers = new Map(); // WebSocket clients subscribed to alerts
  }

  initializeWebSocket(server) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws) => {
      console.log('New client connected to alert service');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'subscribe') {
            this.handleSubscription(ws, data);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.subscribers.delete(ws);
      });
    });

    // Listen for new alerts
    this.eventEmitter.on('newAlert', (alert) => {
      this.broadcastAlert(alert);
    });
  }

  handleSubscription(ws, data) {
    const filters = {
      types: data.alertTypes || [],
      severity: data.severityLevels || [],
      assets: data.assets || []
    };
    this.subscribers.set(ws, filters);
  }

  async broadcastAlert(alert) {
    const alertData = JSON.stringify({
      type: 'alert',
      data: alert
    });

    for (const [ws, filters] of this.subscribers.entries()) {
      try {
        if (this.shouldSendAlert(alert, filters)) {
          ws.send(alertData);
        }
      } catch (error) {
        console.error('Error sending alert to WebSocket client:', error);
        this.subscribers.delete(ws);
      }
    }
  }

  shouldSendAlert(alert, filters) {
    if (filters.types.length && !filters.types.includes(alert.type)) {
      return false;
    }
    if (filters.severity.length && !filters.severity.includes(alert.severity)) {
      return false;
    }
    if (filters.assets.length && !filters.assets.includes(alert.affectedAsset)) {
      return false;
    }
    return true;
  }

  async find(query) {
    try {
      return await Alert.find(query)
        .sort({ createdAt: -1 })
        .populate('acknowledgedBy', 'name')
        .populate('resolvedBy', 'name')
        .populate('notes.createdBy', 'name');
    } catch (error) {
      throw new Error(`Error in alert find operation: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Alert.findById(id)
        .populate('acknowledgedBy', 'name')
        .populate('resolvedBy', 'name')
        .populate('notes.createdBy', 'name');
    } catch (error) {
      throw new Error(`Error in alert findById operation: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const alert = await Alert.create(data);
      
      // Emit event for real-time notifications
      this.eventEmitter.emit('newAlert', alert);
      
      return alert;
    } catch (error) {
      throw new Error(`Error in alert create operation: ${error.message}`);
    }
  }

  async update(query, updateData, options) {
    try {
      const alert = await Alert.findOneAndUpdate(query, updateData, { ...options, new: true })
        .populate('acknowledgedBy', 'name')
        .populate('resolvedBy', 'name')
        .populate('notes.createdBy', 'name');

      if (alert) {
        // Emit event for real-time notifications
        this.eventEmitter.emit('alertUpdated', alert);
      }

      return alert;
    } catch (error) {
      throw new Error(`Error in alert update operation: ${error.message}`);
    }
  }

  async delete(query) {
    try {
      const alert = await Alert.findOneAndDelete(query);
      
      if (alert) {
        // Emit event for real-time notifications
        this.eventEmitter.emit('alertDeleted', alert);
      }

      return alert;
    } catch (error) {
      throw new Error(`Error in alert delete operation: ${error.message}`);
    }
  }

  async acknowledge(alertId, userId) {
    try {
      const alert = await this.findById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      await alert.acknowledge(userId);
      return alert;
    } catch (error) {
      throw new Error(`Error acknowledging alert: ${error.message}`);
    }
  }

  async resolve(alertId, userId, resolution) {
    try {
      const alert = await this.findById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      await alert.resolve(userId, resolution);
      return alert;
    } catch (error) {
      throw new Error(`Error resolving alert: ${error.message}`);
    }
  }

  async addNote(alertId, userId, text) {
    try {
      const alert = await this.findById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      await alert.addNote(userId, text);
      return alert;
    } catch (error) {
      throw new Error(`Error adding note to alert: ${error.message}`);
    }
  }

  async getAlertStats() {
    try {
      const stats = await Alert.aggregate([
        {
          $group: {
            _id: {
              type: '$type',
              status: '$status',
              severity: '$severity'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            statuses: {
              $push: {
                status: '$_id.status',
                severity: '$_id.severity',
                count: '$count'
              }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Error getting alert stats: ${error.message}`);
    }
  }
}

// Create singleton instance
const alertService = new AlertService();

export default alertService;
