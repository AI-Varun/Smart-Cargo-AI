import shipService from '../services/shipService.js';

class ShipController {
  async getShips(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'lastUpdate',
        sortOrder = 'desc',
        search,
        bounds
      } = req.query;

      // Build base query
      let query = shipService.getQuery();

      // Add filters
      const filters = {};
      if (status) filters.status = status;
      
      // Add location-based search if bounds provided
      if (bounds) {
        const [sw, ne] = bounds.split(';').map(coord => coord.split(',').map(Number));
        filters.location = {
          $geoWithin: {
            $box: [sw, ne]
          }
        };
      }

      // Add text search
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { vesselNumber: { $regex: search, $options: 'i' } }
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
      const [ships, total] = await Promise.all([
        shipService.find(query),
        shipService.count(filters)
      ]);

      res.json({
        ships,
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

  async getShipById(req, res) {
    try {
      const { id } = req.params;

      const query = shipService.getQuery().findById(id);
      const ship = await shipService.find(query);

      if (!ship) {
        return res.status(404).json({ error: 'Ship not found' });
      }

      res.json(ship);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createShip(req, res) {
    try {
      const {
        name,
        vesselNumber,
        capacity,
        location,
        status = 'active'
      } = req.body;

      // Validate required fields
      if (!name || !vesselNumber || !capacity) {
        return res.status(400).json({
          error: 'Missing required fields: name, vesselNumber, and capacity are required'
        });
      }

      // Create ship data with defaults
      const shipData = {
        name,
        vesselNumber,
        capacity,
        status,
        lastUpdate: new Date(),
        location: location || null
      };

      const ship = await shipService.create(shipData);
      res.status(201).json(ship);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateShip(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove immutable fields
      delete updateData._id;
      delete updateData.vesselNumber;

      // Add update timestamp
      updateData.lastUpdate = new Date();

      const query = { _id: id };
      const options = { new: true };

      const ship = await shipService.update(query, updateData, options);

      if (!ship) {
        return res.status(404).json({ error: 'Ship not found' });
      }

      res.json(ship);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateShipLocation(req, res) {
    try {
      const { id } = req.params;
      const { coordinates } = req.body;

      if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        return res.status(400).json({
          error: 'Invalid coordinates. Must be an array of [longitude, latitude]'
        });
      }

      const updateData = {
        location: {
          type: 'Point',
          coordinates
        },
        lastUpdate: new Date()
      };

      const query = { _id: id };
      const options = { new: true };

      const ship = await shipService.update(query, updateData, options);

      if (!ship) {
        return res.status(404).json({ error: 'Ship not found' });
      }

      res.json(ship);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateShipStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, dockingSchedule, delayReason } = req.body;

      if (!status) {
        return res.status(400).json({
          error: 'Status is required'
        });
      }

      const updateData = {
        status,
        lastUpdate: new Date()
      };

      if (dockingSchedule) {
        updateData.dockingSchedule = dockingSchedule;
      }

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

      const ship = await shipService.update(query, updateData, options);

      if (!ship) {
        return res.status(404).json({ error: 'Ship not found' });
      }

      res.json(ship);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteShip(req, res) {
    try {
      const { id } = req.params;

      const ship = await shipService.delete({ _id: id });

      if (!ship) {
        return res.status(404).json({ error: 'Ship not found' });
      }

      res.json({ message: 'Ship deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getShipStats(req, res) {
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
            capacityStats: [
              {
                $group: {
                  _id: null,
                  totalCapacity: { $sum: '$capacity' },
                  avgCapacity: { $avg: '$capacity' },
                  minCapacity: { $min: '$capacity' },
                  maxCapacity: { $max: '$capacity' }
                }
              }
            ],
            locationHeatmap: [
              {
                $match: {
                  location: { $exists: true, $ne: null }
                }
              },
              {
                $group: {
                  _id: {
                    $concat: [
                      { $toString: { $arrayElemAt: ['$location.coordinates', 1] } },
                      ',',
                      { $toString: { $arrayElemAt: ['$location.coordinates', 0] } }
                    ]
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ];

      const stats = await shipService.aggregate(pipeline);
      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ShipController();
