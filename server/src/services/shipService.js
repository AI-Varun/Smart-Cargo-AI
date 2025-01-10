import { Ship } from '../models/Ship.js';

class ShipService {
  async find(query) {
    try {
      return await query.exec();
    } catch (error) {
      throw new Error(`Error in ship find operation: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Ship.findById(id);
    } catch (error) {
      throw new Error(`Error in ship findById operation: ${error.message}`);
    }
  }

  async create(data) {
    try {
      return await Ship.create(data);
    } catch (error) {
      throw new Error(`Error in ship create operation: ${error.message}`);
    }
  }

  async update(query, updateData, options) {
    try {
      return await Ship.findOneAndUpdate(query, updateData, options);
    } catch (error) {
      throw new Error(`Error in ship update operation: ${error.message}`);
    }
  }

  async delete(query) {
    try {
      return await Ship.findOneAndDelete(query);
    } catch (error) {
      throw new Error(`Error in ship delete operation: ${error.message}`);
    }
  }

  async aggregate(pipeline) {
    try {
      return await Ship.aggregate(pipeline);
    } catch (error) {
      throw new Error(`Error in ship aggregate operation: ${error.message}`);
    }
  }

  async count(query) {
    try {
      return await Ship.countDocuments(query);
    } catch (error) {
      throw new Error(`Error in ship count operation: ${error.message}`);
    }
  }

  // Helper method to get base query
  getQuery() {
    return Ship.find();
  }
}

export default new ShipService();
