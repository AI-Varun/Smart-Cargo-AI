import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  source: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  destination: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  vehicleType: {
    type: String,
    enum: ['Ship', 'Truck'],
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'vehicleType',
    validate: {
      validator: async function(value) {
        const model = this.vehicleType === 'Truck' ? 'Truck' : 'Ship';
        const Vehicle = mongoose.model(model);
        const vehicle = await Vehicle.findById(value);
        return vehicle !== null;
      },
      message: 'Invalid vehicle ID'
    }
  },
  eta: {
    type: Date,
    required: true
  },
  contents: [{
    type: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: null
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Create geospatial indexes
shipmentSchema.index({ 'source': '2dsphere' });
shipmentSchema.index({ 'destination': '2dsphere' });
shipmentSchema.index({ 'currentLocation': '2dsphere' });

// Pre-save middleware to update timestamps
shipmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-update middleware to update timestamps
shipmentSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this._update.updatedAt = new Date();
  next();
});

export const Shipment = mongoose.model('Shipment', shipmentSchema);
