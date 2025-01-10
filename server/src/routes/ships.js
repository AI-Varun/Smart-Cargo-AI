import { Ship } from '../models/Ship.js';

export default async function (fastify, opts) {
  // Get all ships
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const ships = await Ship.find();
      reply.send(ships);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get ship by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const ship = await Ship.findById(request.params.id);
      if (!ship) {
        return reply.code(404).send({ message: 'Ship not found' });
      }
      reply.send(ship);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Update ship location
  fastify.put('/:id/location', {
    onRequest: [fastify.authenticate],
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
      const ship = await Ship.findByIdAndUpdate(
        request.params.id,
        {
          location: {
            type: 'Point',
            coordinates: request.body.coordinates
          },
          lastUpdate: new Date()
        },
        { new: true }
      );

      if (!ship) {
        return reply.code(404).send({ message: 'Ship not found' });
      }

      reply.send(ship);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Update ship status and docking schedule
  fastify.put('/:id/status', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['in_transit', 'docked', 'scheduled', 'delayed']
          },
          dockingSchedule: {
            type: 'object',
            properties: {
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              dockId: { type: 'string' }
            }
          },
          delayReason: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const updateData = {
        status: request.body.status,
        lastUpdate: new Date()
      };

      if (request.body.dockingSchedule) {
        updateData.dockingSchedule = request.body.dockingSchedule;
      }

      if (request.body.status === 'delayed' && request.body.delayReason) {
        updateData.delayReason = request.body.delayReason;
      }

      const ship = await Ship.findByIdAndUpdate(
        request.params.id,
        updateData,
        { new: true }
      );

      if (!ship) {
        return reply.code(404).send({ message: 'Ship not found' });
      }

      reply.send(ship);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get ships in area
  fastify.get('/area', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        required: ['bounds'],
        properties: {
          bounds: {
            type: 'object',
            required: ['sw', 'ne'],
            properties: {
              sw: {
                type: 'array',
                items: { type: 'number' },
                minItems: 2,
                maxItems: 2
              },
              ne: {
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
      const { bounds } = request.query;

      const ships = await Ship.find({
        location: {
          $geoWithin: {
            $box: [
              bounds.sw,
              bounds.ne
            ]
          }
        }
      });

      reply.send(ships);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

    // Create a new ship
    fastify.post('/', {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['shipId', 'name', 'capacity', 'status'],
          properties: {
            shipId: { type: 'string' },
            name: { type: 'string' },
            capacity: { type: 'number' },
            status: { type: 'string', enum: ['at_dock', 'sailing'] },
            aisData: { type: 'string' },
            dockingSchedule: {
              type: 'object',
              properties: {
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
                dockId: { type: 'string' },
                wharfAllocation: { type: 'string' }
              }
            },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Point'] },
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
        const shipData = request.body;
        const newShip = new Ship(shipData);
        await newShip.save();
        reply.code(201).send(newShip);
      } catch (error) {
        console.error('Error creating ship:', error);
        reply.code(500).send({ 
          message: 'Failed to create ship', 
          error: error.message 
        });
      }
    });

      // Enable or disable ship tracking
  // Enable or disable ship tracking
  fastify.post('/:shipId/tracking', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          shipId: { type: 'string' }
        },
        required: ['shipId']
      },
      body: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' }
        },
        required: ['enabled']
      }
    }
  }, async (request, reply) => {
    try {
      const { shipId } = request.params;

      // Validate shipId
      if (!shipId || shipId === 'undefined') {
        return reply.code(400).send({ 
          message: 'Invalid ship ID',
          shipId 
        });
      }

      const { enabled } = request.body;

      // Find the ship and update tracking status
      const ship = await Ship.findByIdAndUpdate(
        shipId, 
        { isTracking: enabled }, 
        { new: true }
      );

      if (!ship) {
        return reply.code(404).send({ 
          message: 'Ship not found',
          shipId 
        });
      }

      reply.send({ 
        message: `Tracking ${enabled ? 'enabled' : 'disabled'}`, 
        ship 
      });
    } catch (error) {
      console.error('Error updating ship tracking:', error);
      reply.code(500).send({ 
        message: 'Failed to update ship tracking', 
        error: error.message 
      });
    }
  });
}
