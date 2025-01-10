import alertService from '../services/alertService.js';

class AlertController {
  async getAlerts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        severity,
        type,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
      } = req.query;

      // Build base query
      let query = alertService.getQuery();

      // Add filters
      const filters = {};
      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      if (type) filters.type = type;
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }
      query.where(filters);

      // Add sort
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      query.sort(sortOptions);

      // Add pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query.skip(skip).limit(parseInt(limit));

      // Add population
      query.populate('acknowledgedBy', 'name email')
           .populate('resolvedBy', 'name email')
           .populate('relatedId');

      // Execute query
      const [alerts, total] = await Promise.all([
        alertService.find(query),
        alertService.count(filters)
      ]);

      res.json({
        alerts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAlertById(req, res) {
    try {
      const { id } = req.params;

      const query = alertService.getQuery().findById(id)
        .populate('acknowledgedBy', 'name email')
        .populate('resolvedBy', 'name email')
        .populate('relatedId');

      const alert = await alertService.find(query);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createAlert(req, res) {
    try {
      const { type, severity, message, relatedId } = req.body;

      // Validate required fields
      if (!type || !severity || !message) {
        return res.status(400).json({
          error: 'Missing required fields: type, severity, and message are required'
        });
      }

      // Create alert data with defaults
      const alertData = {
        type,
        severity,
        message,
        relatedId,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const alert = await alertService.create(alertData);
      
      // Populate references for response
      const populatedAlert = await alertService.find(
        alertService.getQuery()
          .findById(alert._id)
          .populate('relatedId')
      );

      res.status(201).json(populatedAlert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAlert(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove immutable fields
      delete updateData._id;
      delete updateData.createdAt;

      // Add update timestamp
      updateData.updatedAt = new Date();

      const query = { _id: id };
      const options = { new: true };

      const alert = await alertService.update(
        query,
        updateData,
        options
      );

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      // Populate references for response
      const populatedAlert = await alertService.find(
        alertService.getQuery()
          .findById(alert._id)
          .populate('acknowledgedBy', 'name email')
          .populate('resolvedBy', 'name email')
          .populate('relatedId')
      );

      res.json(populatedAlert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async acknowledgeAlert(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Assuming user info is attached by auth middleware

      const updateData = {
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      };

      const query = { _id: id };
      const options = { new: true };

      const alert = await alertService.update(query, updateData, options);

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      // Populate references for response
      const populatedAlert = await alertService.find(
        alertService.getQuery()
          .findById(alert._id)
          .populate('acknowledgedBy', 'name email')
          .populate('resolvedBy', 'name email')
          .populate('relatedId')
      );

      res.json(populatedAlert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async resolveAlert(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Assuming user info is attached by auth middleware
      const { resolution } = req.body;

      if (!resolution) {
        return res.status(400).json({
          error: 'Resolution message is required'
        });
      }

      const updateData = {
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolution,
        updatedAt: new Date()
      };

      const query = { _id: id };
      const options = { new: true };

      const alert = await alertService.update(query, updateData, options);

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      // Populate references for response
      const populatedAlert = await alertService.find(
        alertService.getQuery()
          .findById(alert._id)
          .populate('acknowledgedBy', 'name email')
          .populate('resolvedBy', 'name email')
          .populate('relatedId')
      );

      res.json(populatedAlert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteAlert(req, res) {
    try {
      const { id } = req.params;

      const alert = await alertService.delete({ _id: id });

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAlertStats(req, res) {
    try {
      const pipeline = [
        {
          $facet: {
            severityCounts: [
              {
                $group: {
                  _id: '$severity',
                  count: { $sum: 1 }
                }
              }
            ],
            statusCounts: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            typeCounts: [
              {
                $group: {
                  _id: '$type',
                  count: { $sum: 1 }
                }
              }
            ],
            timeToResolve: [
              {
                $match: {
                  status: 'resolved',
                  resolvedAt: { $exists: true },
                  createdAt: { $exists: true }
                }
              },
              {
                $project: {
                  timeToResolve: {
                    $subtract: ['$resolvedAt', '$createdAt']
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  averageTime: { $avg: '$timeToResolve' },
                  minTime: { $min: '$timeToResolve' },
                  maxTime: { $max: '$timeToResolve' }
                }
              }
            ]
          }
        }
      ];

      const stats = await alertService.aggregate(pipeline);
      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AlertController();
