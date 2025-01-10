import mongoose from 'mongoose';

const truckSchema = new mongoose.Schema({
  truckId: {
    type: String,
    required: true,
    unique: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  driverName: {
    type: String,
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
      required: true,
      default: [0, 0]
    }
  },
  status: {
    type: String,
    enum: ['available', 'en_route', 'maintenance'],
    default: 'available'
  },
  capacity: {
    type: Number,
    required: true
  },
  gpsEnabled: {
    type: Boolean,
    default: true
  },
  currentRoute: {
    type: {
      origin: {
        type: [Number],
        required: true
      },
      destination: {
        type: [Number],
        required: true
      },
      waypoints: [[Number]],
      startTime: Date,
      estimatedEndTime: Date
    },
    required: false
  },
  routeProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a 2dsphere index for location-based queries
truckSchema.index({ location: '2dsphere' });

// Virtual for full driver details
truckSchema.virtual('driverDetails').get(function() {
  return `${this.driverName} (${this.registrationNumber})`;
});

// Method to check if truck is available for assignment
truckSchema.methods.isAvailable = function() {
  return this.status === 'available';
};

// Method to start tracking
truckSchema.methods.startTracking = function() {
  if (!this.gpsEnabled) {
    this.gpsEnabled = true;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to stop tracking
truckSchema.methods.stopTracking = function() {
  if (this.gpsEnabled) {
    this.gpsEnabled = false;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update location
truckSchema.methods.updateLocation = function(coordinates) {
  this.location.coordinates = coordinates;
  this.updatedAt = new Date();
  return this.save();
};

// Method to update route progress
truckSchema.methods.updateRouteProgress = function(progress) {
  this.routeProgress = progress;
  this.updatedAt = new Date();
  return this.save();
};

export const Truck = mongoose.model('Truck', truckSchema);
