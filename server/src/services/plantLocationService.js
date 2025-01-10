const axios = require('axios');
const PlantLocation = require('../models/PlantLocation');

class PlantLocationService {
  constructor() {
    this.osrmBaseUrl = process.env.OSRM_BASE_URL || 'http://router.project-osrm.org';
  }

  async searchAddress(query) {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 5
        },
        headers: {
          'User-Agent': 'smart-cargo-ai'
        }
      });
      return response.data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }));
    } catch (error) {
      console.error('Error searching address:', error);
      throw new Error('Failed to search address');
    }
  }

  async getRoute(origin, destination) {
    try {
      const response = await axios.get(
        `${this.osrmBaseUrl}/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`,
        {
          params: {
            overview: 'full',
            geometries: 'geojson',
            steps: true
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting route:', error);
      throw new Error('Failed to get route');
    }
  }

  async createPlantLocation(data) {
    try {
      const plantLocation = new PlantLocation({
        name: data.name,
        address: data.address,
        location: {
          type: 'Point',
          coordinates: [data.longitude, data.latitude]
        }
      });
      return await plantLocation.save();
    } catch (error) {
      console.error('Error creating plant location:', error);
      throw error;
    }
  }

  async getAllPlantLocations() {
    try {
      return await PlantLocation.find({ isActive: true });
    } catch (error) {
      console.error('Error getting plant locations:', error);
      throw error;
    }
  }

  async updatePlantLocation(id, data) {
    try {
      return await PlantLocation.findByIdAndUpdate(
        id,
        {
          ...data,
          updatedAt: Date.now()
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating plant location:', error);
      throw error;
    }
  }

  async deletePlantLocation(id) {
    try {
      return await PlantLocation.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: Date.now() },
        { new: true }
      );
    } catch (error) {
      console.error('Error deleting plant location:', error);
      throw error;
    }
  }
}

module.exports = new PlantLocationService();
