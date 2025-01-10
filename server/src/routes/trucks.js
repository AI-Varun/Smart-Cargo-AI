import { Truck } from '../models/Truck.js';
import { authenticate } from '../middleware/auth.js';

export default async function(fastify, opts) {
  // Get all trucks
  fastify.get('/', {
    onRequest: authenticate
  }, async (request, reply) => {
    try {
      const trucks = await Truck.find();
      reply.send(trucks);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Create new truck
  fastify.post('/', {
    onRequest: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['truckId', 'registrationNumber'],
        properties: {
          truckId: { type: 'string' },
          registrationNumber: { type: 'string' },
          driverName: { type: 'string' },
          capacity: { type: 'number' },
          status: { 
            type: 'string',
            enum: ['available', 'en_route', 'maintenance']
          },
          gpsEnabled: { type: 'boolean' },
          location: {
            type: 'object',
            properties: {
              coordinates: {
                type: 'array',
                items: { type: 'number' },
                minItems: 2,
                maxItems: 2
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const existingTruck = await Truck.findOne({
        $or: [
          { truckId: request.body.truckId },
          { registrationNumber: request.body.registrationNumber }
        ]
      });

      if (existingTruck) {
        return reply.code(400).send({
          message: 'A truck with this ID or registration number already exists'
        });
      }

      const truck = new Truck({
        ...request.body,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await truck.save();
      reply.code(201).send(truck);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get truck by ID
  fastify.get('/:id', {
    onRequest: authenticate
  }, async (request, reply) => {
    try {
      const truck = await Truck.findById(request.params.id);
      if (!truck) {
        return reply.code(404).send({ message: 'Truck not found' });
      }
      reply.send(truck);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Update truck location
  fastify.put('/:id/location', {
    onRequest: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['coordinates'],
        properties: {
          coordinates: {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 2
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const truck = await Truck.findByIdAndUpdate(
        request.params.id,
        {
          $set: {
            'location.coordinates': request.body.coordinates,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!truck) {
        return reply.code(404).send({ message: 'Truck not found' });
      }

      reply.send(truck);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Update truck status
  fastify.put('/:id/status', {
    onRequest: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['available', 'en_route', 'maintenance']
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const truck = await Truck.findByIdAndUpdate(
        request.params.id,
        {
          $set: {
            status: request.body.status,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      
      if (!truck) {
        return reply.code(404).send({ message: 'Truck not found' });
      }
      
      reply.send(truck);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Toggle truck tracking
  fastify.post('/:id/tracking', {
    onRequest: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['enabled'],
        properties: {
          enabled: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const truck = await Truck.findByIdAndUpdate(
        request.params.id,
        {
          $set: {
            gpsEnabled: request.body.enabled,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      
      if (!truck) {
        return reply.code(404).send({ message: 'Truck not found' });
      }
      
      reply.send(truck);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get nearby trucks
  fastify.get('/nearby', {
    onRequest: authenticate,
    schema: {
      querystring: {
        type: 'object',
        required: ['lat', 'lng', 'radius'],
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
          radius: { type: 'number' } // in kilometers
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { lat, lng, radius } = request.query;
      
      const trucks = await Truck.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius * 1000 // Convert to meters
          }
        }
      });
      
      reply.send(trucks);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });
}
