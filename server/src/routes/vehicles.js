import { Truck } from '../models/Truck.js';
import { Ship } from '../models/Ship.js';

export default async function(fastify, opts) {
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['truck', 'ship'] },
              name: { type: 'string' },
              status: { type: 'string' },
              location: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              },
              currentShipment: { type: 'string', nullable: true }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [trucks, ships] = await Promise.all([
        Truck.find({}).lean(),
        Ship.find({}).lean()
      ]);

      // Transform trucks and ships into a unified format
      const vehicles = [
        ...trucks.map(truck => ({
          id: truck._id.toString(),
          type: 'truck',
          name: truck.name,
          status: truck.status,
          location: {
            lat: truck.location?.coordinates[1] || 0,
            lng: truck.location?.coordinates[0] || 0
          },
          currentShipment: truck.currentShipment?.toString() || null
        })),
        ...ships.map(ship => ({
          id: ship._id.toString(),
          type: 'ship',
          name: ship.name,
          status: ship.status,
          location: {
            lat: ship.location?.coordinates[1] || 0,
            lng: ship.location?.coordinates[0] || 0
          },
          currentShipment: ship.currentShipment?.toString() || null
        }))
      ];

      reply.send(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Error fetching vehicles'
      });
    }
  });
}
