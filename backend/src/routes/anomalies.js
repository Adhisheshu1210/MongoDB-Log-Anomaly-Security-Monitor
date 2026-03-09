/**
 * Anomaly Routes
 * Handles anomaly retrieval and management
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// @route   GET /api/anomalies
// @desc    Get all anomalies with filtering and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      type,
      isResolved,
      startDate,
      endDate,
      minScore,
      sort = '-timestamp'
    } = req.query;

    // Build query
    const query = {};

    if (severity) {
      query.severity = { $in: severity.split(',') };
    }

    if (type) {
      query.type = { $in: type.split(',') };
    }

    if (isResolved !== undefined) {
      query.isResolved = isResolved === 'true';
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (minScore) {
      query.anomalyScore = { $gte: parseFloat(minScore) };
    }

    // Execute query with pagination
    const anomalies = await Anomaly.find(query)
      .populate('logId', 'timestamp severity component message')
      .populate('resolvedBy', 'username email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Anomaly.countDocuments(query);

    res.json({
      success: true,
      data: anomalies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get anomalies error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching anomalies'
    });
  }
});

// @route   GET /api/anomalies/:id
// @desc    Get single anomaly by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const anomaly = await Anomaly.findById(req.params.id)
      .populate('logId')
      .populate('resolvedBy', 'username email')
      .populate('relatedAlerts')
      .lean();

    if (!anomaly) {
      return res.status(404).json({
        success: false,
        message: 'Anomaly not found'
      });
    }

    res.json({
      success: true,
      data: anomaly
    });
  } catch (error) {
    logger.error('Get anomaly error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching anomaly'
    });
  }
});

// @route   GET /api/anomalies/recent/:limit
// @desc    Get recent anomalies (real-time feed)
// @access  Private
router.get('/recent/:limit', protect, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 20;
    
    const anomalies = await Anomaly.find()
      .populate('logId', 'timestamp severity component message')
      .sort('-timestamp')
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    logger.error('Get recent anomalies error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent anomalies'
    });
  }
});

// @route   PUT /api/anomalies/:id/resolve
// @desc    Resolve an anomaly
// @access  Private (Admin)
router.put('/:id/resolve', protect, async (req, res) => {
  try {
    const anomaly = await Anomaly.findById(req.params.id);

    if (!anomaly) {
      return res.status(404).json({
        success: false,
        message: 'Anomaly not found'
      });
    }

    anomaly.isResolved = true;
    anomaly.resolvedAt = new Date();
    anomaly.resolvedBy = req.user._id;
    await anomaly.save();

    // Update related alerts
    if (anomaly.relatedAlerts && anomaly.relatedAlerts.length > 0) {
      await Alert.updateMany(
        { _id: { $in: anomaly.relatedAlerts } },
        { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user._id }
      );
    }

    // Emit to WebSocket
    const io = req.app.get('io');
    io.emit('anomaly:resolved', anomaly);

    res.json({
      success: true,
      data: anomaly
    });
  } catch (error) {
    logger.error('Resolve anomaly error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error resolving anomaly'
    });
  }
});

// @route   POST /api/anomalies
// @desc    Create a new anomaly (for testing/manual entry)
// @access  Private (Admin)
router.post('/', protect, authorize('admin', 'user'), async (req, res) => {
  try {
    const anomaly = await Anomaly.create(req.body);

    // Emit to WebSocket
    const io = req.app.get('io');
    io.emit('anomaly:detected', anomaly);

    // Create alert for critical/high anomalies
    if (['critical', 'high'].includes(anomaly.severity)) {
      const alert = await Alert.create({
        title: `Anomaly Detected: ${anomaly.title}`,
        message: anomaly.description,
        severity: anomaly.severity,
        category: anomaly.type,
        source: 'anomaly',
        sourceId: anomaly._id,
        anomalyId: anomaly._id
      });

      // Update anomaly with alert reference
      anomaly.relatedAlerts = [alert._id];
      await anomaly.save();

      // Emit alert
      io.emit('alert:new', alert);
    }

    res.status(201).json({
      success: true,
      data: anomaly
    });
  } catch (error) {
    logger.error('Create anomaly error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating anomaly'
    });
  }
});

// @route   DELETE /api/anomalies/:id
// @desc    Delete an anomaly
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const anomaly = await Anomaly.findByIdAndDelete(req.params.id);

    if (!anomaly) {
      return res.status(404).json({
        success: false,
        message: 'Anomaly not found'
      });
    }

    // Delete related alerts
    if (anomaly.relatedAlerts && anomaly.relatedAlerts.length > 0) {
      await Alert.deleteMany({ _id: { $in: anomaly.relatedAlerts } });
    }

    res.json({
      success: true,
      message: 'Anomaly deleted'
    });
  } catch (error) {
    logger.error('Delete anomaly error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting anomaly'
    });
  }
});

module.exports = router;

