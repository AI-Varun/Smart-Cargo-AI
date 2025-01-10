import { Shipment } from '../models/Shipment.js';
import shipmentService from '../services/shipmentService.js';

export default async function(fastify, opts) {
  // Get all shipments
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const shipments = await Shipment.find()
        .populate('vehicle');
      reply.send(shipments);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get shipment by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const shipment = await Shipment.findById(request.params.id)
        .populate('vehicle');
      if (!shipment) {
        return reply.code(404).send({ message: 'Shipment not found' });
      }
      reply.send(shipment);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Create new shipment
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['source', 'destination', 'vehicleType', 'eta'],
        properties: {
          source: {
            type: 'object',
            required: ['coordinates', 'address'],
            properties: {
              coordinates: {
                type: 'array',
                items: { type: 'number' },
                minItems: 2,
                maxItems: 2
              },
              address: { type: 'string' }
            }
          },
          destination: {
            type: 'object',
            required: ['coordinates', 'address'],
            properties: {
              coordinates: {
                type: 'array',
                items: { type: 'number' },
                minItems: 2,
                maxItems: 2
              },
              address: { type: 'string' }
            }
          },
          vehicleType: {
            type: 'string',
            enum: ['Ship', 'Truck']
          },
          eta: { 
            type: 'string', 
            format: 'date-time' 
          },
          status: {
            type: 'string',
            enum: ['pending', 'in-transit', 'delivered', 'cancelled'],
            default: 'pending'
          },
          contents: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'quantity'],
              properties: {
                type: { type: 'string' },
                quantity: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const newShipment = await shipmentService.create(request.body);
      reply.code(201).send(newShipment);
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Update shipment status
  fastify.put('/:id/status', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'in-transit', 'delivered', 'cancelled']
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const updateData = {
        status: request.body.status,
        ...(request.body.status === 'delivered' && { actualDeliveryTime: new Date() })
      };

      const shipment = await Shipment.findByIdAndUpdate(
        request.params.id,
        { $set: updateData },
        { new: true }
      ).populate('vehicle');
      
      if (!shipment) {
        return reply.code(404).send({ message: 'Shipment not found' });
      }
      
      reply.send(shipment);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get shipment location
  fastify.get('/:id/location', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const shipment = await Shipment.findById(request.params.id);
      if (!shipment) {
        return reply.code(404).send({ message: 'Shipment not found' });
      }

      // For debugging
      console.log('Shipment data:', JSON.stringify(shipment, null, 2));

      // Default coordinates for Mumbai and Bangalore
      const defaultSource = [72.8777, 19.0760]; // Mumbai [longitude, latitude]
      const defaultDestination = [77.5946, 12.9716]; // Bangalore [longitude, latitude]

      // Get coordinates with fallbacks
      const source = (shipment.source && Array.isArray(shipment.source.coordinates)) 
        ? shipment.source.coordinates 
        : defaultSource;

      const destination = (shipment.destination && Array.isArray(shipment.destination.coordinates))
        ? shipment.destination.coordinates
        : defaultDestination;

      // Calculate progress based on time or status
      let progress = 0;
      if (shipment.status === 'in-transit') {
        const startTime = new Date(shipment.createdAt).getTime();
        const endTime = new Date(shipment.eta).getTime();
        const currentTime = Date.now();
        progress = Math.min(1, (currentTime - startTime) / (endTime - startTime));
      } else if (shipment.status === 'delivered') {
        progress = 1;
      }

      // Linear interpolation between source and destination
      const currentLocation = {
        type: 'Point',
        coordinates: [
          source[0] + (destination[0] - source[0]) * progress,
          source[1] + (destination[1] - source[1]) * progress
        ]
      };

      console.log('Calculated location:', currentLocation);
      reply.send({ location: currentLocation });
    } catch (error) {
      console.error('Location error:', error);
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get shipment route
  fastify.get('/:id/route', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const shipment = await Shipment.findById(request.params.id);
      if (!shipment) {
        return reply.code(404).send({ message: 'Shipment not found' });
      }

      // Return source and destination coordinates
      reply.send({
        source: shipment.source.coordinates,
        destination: shipment.destination.coordinates
      });
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });
}
