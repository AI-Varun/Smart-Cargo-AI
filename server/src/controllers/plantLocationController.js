import PlantLocation from '../models/PlantLocation.js';
import axios from 'axios';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

class PlantLocationController {
  async searchAddress(request, reply) {
    try {
      const { query } = request.query;
      if (!query) {
        return reply.code(400).send({ message: 'Search query is required' });
      }

      const response = await axios.get(
        `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        {
          headers: {
            'User-Agent': 'Smart-Cargo-AI/1.0'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error searching address:', error);
      return reply.code(500).send({ message: 'Error searching for address' });
    }
  }

  async createPlantLocation(request, reply) {
    try {
      const location = new PlantLocation(request.body);
      await location.save();
      return reply.code(201).send(location);
    } catch (error) {
      console.error('Error creating plant location:', error);
      return reply.code(500).send({ message: 'Error creating plant location' });
    }
  }

  async getPlantLocations(request, reply) {
    try {
      const locations = await PlantLocation.find();
      return locations;
    } catch (error) {
      console.error('Error fetching plant locations:', error);
      return reply.code(500).send({ message: 'Error fetching plant locations' });
    }
  }

  async getPlantLocation(request, reply) {
    try {
      const location = await PlantLocation.findById(request.params.id);
      if (!location) {
        return reply.code(404).send({ message: 'Plant location not found' });
      }
      return location;
    } catch (error) {
      console.error('Error fetching plant location:', error);
      return reply.code(500).send({ message: 'Error fetching plant location' });
    }
  }

  async updatePlantLocation(request, reply) {
    try {
      const location = await PlantLocation.findByIdAndUpdate(
        request.params.id,
        request.body,
        { new: true }
      );
      if (!location) {
        return reply.code(404).send({ message: 'Plant location not found' });
      }
      return location;
    } catch (error) {
      console.error('Error updating plant location:', error);
      return reply.code(500).send({ message: 'Error updating plant location' });
    }
  }

  async deletePlantLocation(request, reply) {
    try {
      const location = await PlantLocation.findByIdAndDelete(request.params.id);
      if (!location) {
        return reply.code(404).send({ message: 'Plant location not found' });
      }
      return { message: 'Plant location deleted successfully' };
    } catch (error) {
      console.error('Error deleting plant location:', error);
      return reply.code(500).send({ message: 'Error deleting plant location' });
    }
  }
}

export default new PlantLocationController();
