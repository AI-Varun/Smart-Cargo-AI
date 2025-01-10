import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

export default async function(fastify, opts) {
  // Register user
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'password', 'company'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          company: { 
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' }
            }
          }
        }
      }
    }
  }, authController.register);

  // Login user
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, authController.login);

  // Get current user profile
  fastify.get('/me', {
    onRequest: authenticate
  }, authController.getProfile);

  // Update user profile
  fastify.put('/me', {
    onRequest: authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          company: { 
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' }
            }
          }
        }
      }
    }
  }, authController.updateProfile);

  // Change password
  fastify.put('/me/password', {
    onRequest: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 }
        }
      }
    }
  }, authController.changePassword);
}
