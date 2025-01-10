import mongoose from 'mongoose';

const shipSchema = new mongoose.Schema({
  shipId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  capacity: {
    type: Number, // in TEU (Twenty-foot Equivalent Unit)
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['at_dock', 'sailing', 'maintenance', 'delayed'],
    default: 'at_dock'
  },
  dockingSchedule: {
    startTime: Date,
    endTime: Date,
    dockId: {
      type: String,
      required: true
    },
    wharfAllocation: {
      type: String,
      required: true
    }
  },
  eta: {
    type: Date
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  route: {
    type: [[Number]], // Array of coordinate pairs for the planned route
    default: []
  },
  aisData: {
    mmsi: String, // Maritime Mobile Service Identity
    navigationStatus: String,
    rateOfTurn: Number,
    speedOverGround: Number,
    courseOverGround: Number,
    trueHeading: Number,
    lastAisUpdate: Date
  },
  assignedShipments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  }],
  delayReason: String,
  currentPort: {
    type: String
  },
  isTracking: {
    type: Boolean,
    default: false
  },
  trackingHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    speed: Number,
    heading: Number
  }],
}, {
  timestamps: true
});

// Index for geospatial queries
shipSchema.index({ location: '2dsphere' });

// Virtual for ship details
shipSchema.virtual('shipDetails').get(function() {
  return `${this.name} (${this.shipId})`;
});

// Method to update AIS data
shipSchema.methods.updateAisData = async function(aisMessage) {
  this.aisData = {
    mmsi: aisMessage.UserID,
    navigationStatus: aisMessage.NavigationalStatus,
    rateOfTurn: aisMessage.RateOfTurn,
    speedOverGround: aisMessage.Sog,
    courseOverGround: aisMessage.Cog,
    trueHeading: aisMessage.TrueHeading,
    lastAisUpdate: new Date()
  };
  
  // Update location
  this.location.coordinates = [aisMessage.Longitude, aisMessage.Latitude];
  this.lastUpdate = new Date();
  
  await this.save();
};

// Method to assign shipment
shipSchema.methods.assignShipment = async function(shipmentId) {
  if (!this.assignedShipments.includes(shipmentId)) {
    this.assignedShipments.push(shipmentId);
    await this.save();
  }
};

// Method to update docking schedule
shipSchema.methods.updateDockingSchedule = async function(schedule) {
  this.dockingSchedule = schedule;
  if (schedule.startTime <= new Date()) {
    this.status = 'at_dock';
  }
  await this.save();
};

// Add this method to the Ship model
shipSchema.methods.updateTrackingLocation = function(locationData) {
  if (!this.isTracking) {
    throw new Error('Tracking is not enabled for this ship');
  }

  // Validate location data
  if (!locationData.coordinates || 
      !Array.isArray(locationData.coordinates) || 
      locationData.coordinates.length !== 2) {
    throw new Error('Invalid location coordinates');
  }

  // Add to tracking history
  this.trackingHistory.push({
    timestamp: new Date(),
    location: {
      type: 'Point',
      coordinates: locationData.coordinates
    },
    speed: locationData.speed || 0,
    heading: locationData.heading || 0
  });

  // Update current location
  this.location = {
    type: 'Point',
    coordinates: locationData.coordinates
  };

  return this.save();
};


export const Ship = mongoose.model('Ship', shipSchema);
