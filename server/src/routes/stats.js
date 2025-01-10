import { Truck } from '../models/Truck.js';
import { Ship } from '../models/Ship.js';
import { Alert } from '../models/Alert.js';

export default async function(fastify, opts) {
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            activeTrucks: { type: 'number' },
            activeShips: { type: 'number' },
            totalAlerts: { type: 'number' },
            resolvedAlerts: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const [activeTrucks, activeShips, totalAlerts, resolvedAlerts] = await Promise.all([
        Truck.countDocuments({ status: 'active' }),
        Ship.countDocuments({ status: 'active' }),
        Alert.countDocuments({}),
        Alert.countDocuments({ status: 'resolved' })
      ]);

      reply.send({
        activeTrucks,
        activeShips,
        totalAlerts,
        resolvedAlerts
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Error fetching stats'
      });
    }
  });
}
