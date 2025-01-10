import { Alert } from '../models/Alert.js';

export default async function(fastify, opts) {
  // Get all alerts
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { status, severity, type } = request.query;
      const query = {};
      
      if (status) query.status = status;
      if (severity) query.severity = severity;
      if (type) query.type = type;

      const alerts = await Alert.find(query)
        .sort({ createdAt: -1 })
        .populate('acknowledgedBy', 'name')
        .populate('resolvedBy', 'name')
        .populate('relatedId');
        
      reply.send(alerts);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Create new alert
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['type', 'severity', 'title', 'message', 'relatedId'],
        properties: {
          type: {
            type: 'string',
            enum: ['truck', 'ship', 'shipment']
          },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical']
          },
          title: { type: 'string' },
          message: { type: 'string' },
          relatedId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const alert = await Alert.create(request.body);
      
      // Here you would typically trigger real-time notifications
      // through WebSocket or similar
      
      reply.code(201).send(alert);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Acknowledge alert
  fastify.put('/:id/acknowledge', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const alert = await Alert.findByIdAndUpdate(
        request.params.id,
        {
          status: 'acknowledged',
          acknowledgedBy: request.user.id,
          acknowledgedAt: new Date()
        },
        { new: true }
      )
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .populate('relatedId');
      
      if (!alert) {
        return reply.code(404).send({ message: 'Alert not found' });
      }
      
      reply.send(alert);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Resolve alert
  fastify.put('/:id/resolve', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const alert = await Alert.findByIdAndUpdate(
        request.params.id,
        {
          status: 'resolved',
          resolvedBy: request.user.id,
          resolvedAt: new Date()
        },
        { new: true }
      )
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .populate('relatedId');
      
      if (!alert) {
        return reply.code(404).send({ message: 'Alert not found' });
      }
      
      reply.send(alert);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get alerts by type and related ID
  fastify.get('/by-related/:type/:relatedId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const alerts = await Alert.find({
        type: request.params.type,
        relatedId: request.params.relatedId
      })
      .sort({ createdAt: -1 })
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .populate('relatedId');
      
      reply.send(alerts);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });

  // Get active alerts count
  fastify.get('/count', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const counts = await Alert.aggregate([
        {
          $match: {
            status: { $ne: 'resolved' }
          }
        },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const result = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
        total: 0
      };
      
      counts.forEach(({ _id, count }) => {
        result[_id] = count;
        result.total += count;
      });
      
      reply.send(result);
    } catch (error) {
      reply.code(500).send({ message: 'Server error', error: error.message });
    }
  });
}
