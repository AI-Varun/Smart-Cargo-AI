import { Truck } from '../models/Truck.js';

class TruckService {
  async find(query) {
    try {
      return await query.exec();
    } catch (error) {
      throw new Error(`Error in truck find operation: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Truck.findById(id);
    } catch (error) {
      throw new Error(`Error in truck findById operation: ${error.message}`);
    }
  }

  async create(data) {
    try {
      return await Truck.create(data);
    } catch (error) {
      throw new Error(`Error in truck create operation: ${error.message}`);
    }
  }

  async update(query, updateData, options) {
    try {
      return await Truck.findOneAndUpdate(query, updateData, options);
    } catch (error) {
      throw new Error(`Error in truck update operation: ${error.message}`);
    }
  }

  async delete(query) {
    try {
      return await Truck.findOneAndDelete(query);
    } catch (error) {
      throw new Error(`Error in truck delete operation: ${error.message}`);
    }
  }

  async aggregate(pipeline) {
    try {
      return await Truck.aggregate(pipeline);
    } catch (error) {
      throw new Error(`Error in truck aggregate operation: ${error.message}`);
    }
  }

  async count(query) {
    try {
      return await Truck.countDocuments(query);
    } catch (error) {
      throw new Error(`Error in truck count operation: ${error.message}`);
    }
  }

  // Helper method to get base query
  getQuery() {
    return Truck.find();
  }
}

export default new TruckService();
