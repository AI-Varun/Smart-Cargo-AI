import plantLocationController from '../controllers/plantLocationController.js';

async function plantLocationRoutes(fastify) {
  // Search for addresses
  fastify.get('/search-address', {
    schema: {
      querystring: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' }
        }
      }
    },
    handler: plantLocationController.searchAddress
  });

  // Create a new plant location
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'location'],
        properties: {
          name: { type: 'string' },
          location: {
            type: 'object',
            required: ['type', 'coordinates'],
            properties: {
              type: { type: 'string', enum: ['Point'] },
              coordinates: {
                type: 'array',
                minItems: 2,
                maxItems: 2,
                items: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: plantLocationController.createPlantLocation
  });

  // Get all plant locations
  fastify.get('/', {
    handler: plantLocationController.getPlantLocations
  });

  // Get a single plant location
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: plantLocationController.getPlantLocation
  });

  // Update a plant location
  fastify.put('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          location: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['Point'] },
              coordinates: {
                type: 'array',
                minItems: 2,
                maxItems: 2,
                items: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: plantLocationController.updatePlantLocation
  });

  // Delete a plant location
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: plantLocationController.deletePlantLocation
  });
}

export default plantLocationRoutes;
