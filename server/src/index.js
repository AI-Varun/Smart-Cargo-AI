import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import truckRoutes from './routes/trucks.js';
import shipRoutes from './routes/ships.js';
import shipmentRoutes from './routes/shipments.js';
import alertRoutes from './routes/alerts.js';
import statsRoutes from './routes/stats.js';
import vehiclesRoutes from './routes/vehicles.js';
import plantLocationRoutes from './routes/plantLocations.js';
import chatRoutes from '../routes/chatRoutes.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-cargo');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Register plugins
async function registerPlugins() {
  // Configure CORS
  await fastify.register(cors, {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key'
  });

  // Register JWT verify decorator
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Register Swagger
  await fastify.register(swagger, {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'Smart Cargo AI API',
        description: 'API documentation',
        version: '1.0.0'
      },
      host: 'localhost',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    },
    exposeRoute: true
  });
}

// Register routes
async function registerRoutes() {
  // Protected routes
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(truckRoutes, { prefix: '/api/trucks' });
  fastify.register(shipRoutes, { prefix: '/api/ships' });
  fastify.register(shipmentRoutes, { prefix: '/api/shipments' });
  fastify.register(alertRoutes, { prefix: '/api/alerts' });
  fastify.register(statsRoutes, { prefix: '/api/stats' });
  fastify.register(vehiclesRoutes, { prefix: '/api/vehicles' });
  fastify.register(plantLocationRoutes, { prefix: '/api/plant-locations' });
  
  // Chat routes (no authentication required)
  fastify.register(chatRoutes, { prefix: '/api/chat' });
}

// Start server
async function start() {
  try {
    await connectDB();
    await registerPlugins();
    await registerRoutes();
    
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log(`Server listening on ${fastify.server.address().port}`);
    
    // Print all registered routes
    console.log('\nRegistered routes:');
    console.log(fastify.printRoutes());
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
