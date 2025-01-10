import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'truck_delay',
      'truck_maintenance',
      'route_deviation',
      'ship_delay',
      'ship_status',
      'ship_stopped',
      'dock_schedule',
      'shipment_delay',
      'system'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  affectedAsset: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'resolved'],
    default: 'open'
  },
  metadata: {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number]
      }
    },
    expectedTime: Date,
    actualTime: Date,
    deviation: Number, // For route deviations in km or time delays in minutes
    relatedAssets: [String] // Additional affected assets
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for quick retrieval and filtering
alertSchema.index({ createdAt: -1 });
alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ type: 1, affectedAsset: 1 });
alertSchema.index({ 'metadata.location': '2dsphere' });

// Virtual for alert title
alertSchema.virtual('title').get(function() {
  const typeMap = {
    truck_delay: 'Truck Delay',
    truck_maintenance: 'Truck Maintenance Required',
    route_deviation: 'Route Deviation Detected',
    ship_delay: 'Ship Delay',
    ship_status: 'Ship Status Change',
    ship_stopped: 'Ship Stopped Unexpectedly',
    dock_schedule: 'Dock Schedule Issue',
    shipment_delay: 'Shipment Delay',
    system: 'System Alert'
  };
  return `${typeMap[this.type] || this.type}: ${this.affectedAsset}`;
});

// Method to add a note
alertSchema.methods.addNote = async function(userId, text) {
  this.notes.push({
    text,
    createdBy: userId
  });
  await this.save();
};

// Method to acknowledge alert
alertSchema.methods.acknowledge = async function(userId) {
  this.status = 'acknowledged';
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  await this.save();
};

// Method to resolve alert
alertSchema.methods.resolve = async function(userId, resolution) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  if (resolution) {
    await this.addNote(userId, `Resolution: ${resolution}`);
  }
  await this.save();
};

export const Alert = mongoose.model('Alert', alertSchema);
