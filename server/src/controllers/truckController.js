import truckService from '../services/truckService.js';

class TruckController {
  async getTrucks(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        lat,
        lng,
        radius,
        startDate,
        endDate,
        companyId
      } = req.query;

      // Build base query
      let query = truckService.getQuery();

      // Add filters
      const filters = {};
      if (status) filters.status = status;
      if (companyId) filters['company.id'] = companyId;
      
      // Add date range filter
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }

      // Add geospatial search if coordinates and radius provided
      if (lat && lng && radius) {
        filters.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseFloat(radius) * 1000 // Convert to meters
          }
        };
      }

      // Add text search
      if (search) {
        filters.$or = [
          { truckId: { $regex: search, $options: 'i' } },
          { 'company.name': { $regex: search, $options: 'i' } },
          { licensePlate: { $regex: search, $options: 'i' } }
        ];
      }

      query.where(filters);

      // Add sort
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      query.sort(sortOptions);

      // Add pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query.skip(skip).limit(parseInt(limit));

      // Execute query
      const [trucks, total] = await Promise.all([
        truckService.find(query),
        truckService.count(filters)
      ]);

      res.json({
        trucks,
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

  async getTruckById(req, res) {
    try {
      const { id } = req.params;
      const truck = await truckService.findById(id);

      if (!truck) {
        return res.status(404).json({ error: 'Truck not found' });
      }

      res.json(truck);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createTruck(req, res) {
    try {
      const {
        company,
        licensePlate,
        model,
        capacity,
        location,
        status = 'active'
      } = req.body;

      // Validate required fields
      if (!company || !licensePlate || !model || !capacity) {
        return res.status(400).json({
          error: 'Missing required fields: company, licensePlate, model, and capacity are required'
        });
      }

      // Validate location format if provided
      if (location && (!Array.isArray(location.coordinates) || location.coordinates.length !== 2)) {
        return res.status(400).json({
          error: 'Location must be a GeoJSON Point with coordinates [longitude, latitude]'
        });
      }

      // Create truck data with defaults
      const truckData = {
        company,
        licensePlate,
        model,
        capacity,
        status,
        location: location || {
          type: 'Point',
          coordinates: [0, 0]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const truck = await truckService.create(truckData);
      res.status(201).json(truck);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTruck(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove immutable fields
      delete updateData._id;
      delete updateData.truckId;
      delete updateData.createdAt;

      // Add update timestamp
      updateData.updatedAt = new Date();

      const query = { _id: id };
      const options = { new: true };

      const truck = await truckService.update(query, updateData, options);

      if (!truck) {
        return res.status(404).json({ error: 'Truck not found' });
      }

      res.json(truck);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTruckLocation(req, res) {
    try {
      const { id } = req.params;
      const { coordinates } = req.body;

      if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        return res.status(400).json({
          error: 'Coordinates must be an array [longitude, latitude]'
        });
      }

      const updateData = {
        location: {
          type: 'Point',
          coordinates
        },
        updatedAt: new Date()
      };

      const query = { _id: id };
      const options = { new: true };

      const truck = await truckService.update(query, updateData, options);

      if (!truck) {
        return res.status(404).json({ error: 'Truck not found' });
      }

      res.json(truck);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTruckStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, delayReason } = req.body;

      if (!status) {
        return res.status(400).json({
          error: 'Status is required'
        });
      }

      const updateData = {
        status,
        updatedAt: new Date()
      };

      if (status === 'delayed' && !delayReason) {
        return res.status(400).json({
          error: 'Delay reason is required when status is delayed'
        });
      }

      if (delayReason) {
        updateData.delayReason = delayReason;
      }

      const query = { _id: id };
      const options = { new: true };

      const truck = await truckService.update(query, updateData, options);

      if (!truck) {
        return res.status(404).json({ error: 'Truck not found' });
      }

      res.json(truck);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTruck(req, res) {
    try {
      const { id } = req.params;
      const truck = await truckService.delete({ _id: id });

      if (!truck) {
        return res.status(404).json({ error: 'Truck not found' });
      }

      res.json({ message: 'Truck deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTruckStats(req, res) {
    try {
      const pipeline = [
        {
          $facet: {
            statusCounts: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            companyStats: [
              {
                $group: {
                  _id: '$company.id',
                  companyName: { $first: '$company.name' },
                  totalTrucks: { $sum: 1 },
                  activeTrucks: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                  },
                  delayedTrucks: {
                    $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] }
                  }
                }
              },
              {
                $project: {
                  companyName: 1,
                  totalTrucks: 1,
                  activeTrucks: 1,
                  delayedTrucks: 1,
                  activeRate: {
                    $multiply: [
                      { $divide: ['$activeTrucks', '$totalTrucks'] },
                      100
                    ]
                  }
                }
              }
            ]
          }
        }
      ];

      const stats = await truckService.aggregate(pipeline);
      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new TruckController();
