import shipmentService from '../services/shipmentService.js';
const Shipment = require('../models/Shipment');
const plantLocationService = require('../services/plantLocationService');
const truckTrackingService = require('../services/truckTrackingService');

class ShipmentController {
  async getShipments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        startDate,
        endDate
      } = req.query;

      // Build base query
      let query = shipmentService.getQuery();

      // Add filters
      const filters = {};
      if (status) filters.status = status;
      
      // Add date range filter
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }

      // Add text search
      if (search) {
        filters.$or = [
          { shipmentId: { $regex: search, $options: 'i' } },
          { 'destination.address': { $regex: search, $options: 'i' } }
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

      // Add population
      query.populate('transportId');

      // Execute query
      const [shipments, total] = await Promise.all([
        shipmentService.find(query),
        shipmentService.count(filters)
      ]);

      res.json({
        shipments,
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

  async getShipmentById(req, res) {
    try {
      const { id } = req.params;

      const query = shipmentService.getQuery()
        .findById(id)
        .populate('transportId');

      const shipment = await shipmentService.find(query);

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      res.json(shipment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createShipment(req, res) {
    try {
      const {
        pickupLocationId,
        deliveryAddress,
        deliveryCoordinates,
        vehicleType,
        vehicleId,
        cargo,
        weight,
        estimatedDeliveryTime
      } = req.body;

      // Generate unique shipment ID
      const shipmentId = 'SHP' + Date.now().toString();

      const shipment = new Shipment({
        shipmentId,
        pickupLocation: pickupLocationId,
        deliveryLocation: {
          address: deliveryAddress,
          coordinates: {
            type: 'Point',
            coordinates: deliveryCoordinates
          }
        },
        vehicleType,
        vehicle: vehicleId,
        cargo,
        weight,
        estimatedDeliveryTime: new Date(estimatedDeliveryTime),
        status: 'pending'
      });

      await shipment.save();
      res.status(201).json(shipment);
    } catch (error) {
      console.error('Error creating shipment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAllShipments(req, res) {
    try {
      const shipments = await Shipment.find()
        .populate('pickupLocation')
        .populate('vehicle')
        .sort({ createdAt: -1 });
      res.json(shipments);
    } catch (error) {
      console.error('Error getting shipments:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getShipmentById(req, res) {
    try {
      const shipment = await Shipment.findOne({ shipmentId: req.params.id })
        .populate('pickupLocation')
        .populate('vehicle');
      
      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      res.json(shipment);
    } catch (error) {
      console.error('Error getting shipment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateShipmentStatus(req, res) {
    try {
      const { status } = req.body;
      const shipment = await Shipment.findOne({ shipmentId: req.params.id });

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      if (status === 'in-transit' && shipment.status === 'pending') {
        // Start tracking when shipment starts transit
        await truckTrackingService.startTracking(shipment.shipmentId);
      } else if (status === 'delivered' || status === 'cancelled') {
        // Stop tracking when shipment is delivered or cancelled
        truckTrackingService.stopTracking(shipment.shipmentId);
      }

      shipment.status = status;
      if (status === 'delivered') {
        shipment.actualDeliveryTime = new Date();
      }

      await shipment.save();
      res.json(shipment);
    } catch (error) {
      console.error('Error updating shipment status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getShipmentLocation(req, res) {
    try {
      const location = await truckTrackingService.getCurrentLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      console.error('Error getting shipment location:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getShipmentRoute(req, res) {
    try {
      const route = await truckTrackingService.getShipmentRoute(req.params.id);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }
      res.json(route);
    } catch (error) {
      console.error('Error getting shipment route:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateShipment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove immutable fields
      delete updateData._id;
      delete updateData.shipmentId;
      delete updateData.createdAt;

      // Add update timestamp
      updateData.updatedAt = new Date();

      const query = { _id: id };
      const options = { new: true };

      const shipment = await shipmentService.update(
        query,
        updateData,
        options
      );

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      // Get populated shipment for response
      const populatedShipment = await shipmentService.find(
        shipmentService.getQuery()
          .findById(shipment._id)
          .populate('transportId')
      );

      res.json(populatedShipment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateShipmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, delayReason, actualDeliveryTime } = req.body;

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

      if (status === 'delivered') {
        updateData.actualDeliveryTime = actualDeliveryTime || new Date();
      }

      const query = { _id: id };
      const options = { new: true };

      const shipment = await shipmentService.update(
        query,
        updateData,
        options
      );

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      // Get populated shipment for response
      const populatedShipment = await shipmentService.find(
        shipmentService.getQuery()
          .findById(shipment._id)
          .populate('transportId')
      );

      res.json(populatedShipment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteShipment(req, res) {
    try {
      const { id } = req.params;

      const shipment = await shipmentService.delete({ _id: id });

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      res.json({ message: 'Shipment deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async bulkCreateShipments(req, res) {
    try {
      const { shipments } = req.body;

      if (!Array.isArray(shipments) || shipments.length === 0) {
        return res.status(400).json({
          error: 'Shipments must be a non-empty array'
        });
      }

      // Validate each shipment
      for (const shipment of shipments) {
        const { destination, cargo, transportType, expectedDeliveryTime } = shipment;
        if (!destination || !cargo || !transportType || !expectedDeliveryTime) {
          return res.status(400).json({
            error: 'Each shipment must have destination, cargo, transportType, and expectedDeliveryTime'
          });
        }
      }

      // Add defaults to each shipment
      const shipmentsWithDefaults = shipments.map(shipment => ({
        ...shipment,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const createdShipments = await shipmentService.bulkCreate(shipmentsWithDefaults);

      // Get populated shipments for response
      const populatedShipments = await shipmentService.find(
        shipmentService.getQuery()
          .find({ _id: { $in: createdShipments.map(s => s._id) } })
          .populate('transportId')
      );

      res.status(201).json(populatedShipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getShipmentStats(req, res) {
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
            deliveryPerformance: [
              {
                $match: {
                  status: 'delivered',
                  actualDeliveryTime: { $exists: true },
                  expectedDeliveryTime: { $exists: true }
                }
              },
              {
                $project: {
                  timeDifference: {
                    $subtract: ['$actualDeliveryTime', '$expectedDeliveryTime']
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  onTimeDeliveries: {
                    $sum: { $cond: [{ $lte: ['$timeDifference', 0] }, 1, 0] }
                  },
                  lateDeliveries: {
                    $sum: { $cond: [{ $gt: ['$timeDifference', 0] }, 1, 0] }
                  },
                  averageDelay: { $avg: '$timeDifference' }
                }
              }
            ]
          }
        }
      ];

      const stats = await shipmentService.aggregate(pipeline);
      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ShipmentController();
