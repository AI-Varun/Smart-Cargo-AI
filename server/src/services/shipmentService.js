import { Shipment } from '../models/Shipment.js';

class ShipmentService {
  async find(query) {
    try {
      return await query.exec();
    } catch (error) {
      throw new Error(`Error in shipment find operation: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Shipment.findById(id);
    } catch (error) {
      throw new Error(`Error in shipment findById operation: ${error.message}`);
    }
  }

  async create(data) {
    try {
      // Generate a unique shipment ID with timestamp and random number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const shipmentId = `SHP${timestamp}${random}`;

      // Format the data with proper GeoJSON structure
      const shipmentData = {
        shipmentId,
        status: data.status || 'pending',
        source: {
          type: 'Point',
          coordinates: data.source.coordinates,
          address: data.source.address
        },
        destination: {
          type: 'Point',
          coordinates: data.destination.coordinates,
          address: data.destination.address
        },
        vehicleType: data.vehicleType,
        vehicle: data.vehicle,
        eta: data.eta,
        contents: data.contents,
        currentLocation: {
          type: 'Point',
          coordinates: data.source.coordinates, // Initially set to source location
          updatedAt: new Date()
        }
      };

      const newShipment = await Shipment.create(shipmentData);
      return newShipment;
    } catch (error) {
      throw new Error(`Error in shipment create operation: ${error.message}`);
    }
  }

  async update(query, updateData, options) {
    try {
      return await Shipment.findOneAndUpdate(query, updateData, options);
    } catch (error) {
      throw new Error(`Error in shipment update operation: ${error.message}`);
    }
  }

  async delete(query) {
    try {
      return await Shipment.findOneAndDelete(query);
    } catch (error) {
      throw new Error(`Error in shipment delete operation: ${error.message}`);
    }
  }

  async bulkCreate(shipments) {
    try {
      const shipmentsWithIds = shipments.map(shipment => ({
        ...shipment,
        shipmentId: 'SHP' + Date.now() + Math.floor(Math.random() * 1000)
      }));
      return await Shipment.insertMany(shipmentsWithIds);
    } catch (error) {
      throw new Error(`Error in shipment bulk create operation: ${error.message}`);
    }
  }

  async aggregate(pipeline) {
    try {
      return await Shipment.aggregate(pipeline);
    } catch (error) {
      throw new Error(`Error in shipment aggregate operation: ${error.message}`);
    }
  }

  async count(query) {
    try {
      return await Shipment.countDocuments(query);
    } catch (error) {
      throw new Error(`Error in shipment count operation: ${error.message}`);
    }
  }

  // Helper method to get base query
  getQuery() {
    return Shipment.find();
  }
}

export default new ShipmentService();
