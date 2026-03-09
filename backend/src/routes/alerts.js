/**
 * Alert Routes
 * Handles alert retrieval and management
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// @route   GET /api/alerts
// @desc    Get all alerts with filtering and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      category,
      status,
      startDate,
      endDate,
      assignedTo,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};

    if (severity) {
      query.severity = { $in: severity.split(',') };
    }

    if (category) {
      query.category = { $in: category.split(',') };
    }

    if (status) {
      query.status = { $in: status.split(',') };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Execute query with pagination
    const alerts = await Alert.find(query)
      .populate('anomalyId', 'title type anomalyScore')
      .populate('assignedTo', 'username email')
      .populate('acknowledgedBy', 'username email')
      .populate('resolvedBy', 'username email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Alert.countDocuments(query);

    // Get counts by status
    const statusCounts = await Alert.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: alerts,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get alerts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts'
    });
  }
});

// @route   GET /api/alerts/:id
// @desc    Get single alert by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('anomalyId')
      .populate('assignedTo', 'username email')
      .populate('acknowledgedBy', 'username email')
      .populate('resolvedBy', 'username email')
      .populate('notes.user', 'username email')
      .lean();

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Get alert error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert'
    });
  }
});

// @route   GET /api/alerts/recent/:limit
// @desc    Get recent alerts (real-time feed)
// @access  Private
router.get('/recent/:limit', protect, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 20;
    
    const alerts = await Alert.find({ status: { $ne: 'resolved' } })
      .populate('anomalyId', 'title type anomalyScore')
      .sort('-createdAt')
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Get recent alerts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent alerts'
    });
  }
});

// @route   POST /api/alerts/:id/acknowledge
// @desc    Acknowledge an alert
// @access  Private
router.post('/:id/acknowledge', protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    if (alert.status !== 'new') {
      return res.status(400).json({
        success: false,
        message: 'Alert is not in new status'
      });
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.user._id;
    await alert.save();

    // Emit to WebSocket
    const io = req.app.get('io');
    io.emit('alert:acknowledged', alert);

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Acknowledge alert error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging alert'
    });
  }
});

// @route   POST /api/alerts/:id/resolve
// @desc    Resolve an alert
// @access  Private
router.post('/:id/resolve', protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;
    
    if (req.body.notes) {
      alert.notes.push({
        text: req.body.notes,
        user: req.user._id
      });
    }
    
    await alert.save();

    // Emit to WebSocket
    const io = req.app.get('io');
    io.emit('alert:resolved', alert);

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Resolve alert error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error resolving alert'
    });
  }
});

// @route   POST /api/alerts/:id/notes
// @desc    Add note to alert
// @access  Private
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Note text is required'
      });
    }

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.notes.push({
      text,
      user: req.user._id
    });
    
    await alert.save();

    const updatedAlert = await Alert.findById(alert._id)
      .populate('notes.user', 'username email');

    res.json({
      success: true,
      data: updatedAlert
    });
  } catch (error) {
    logger.error('Add note error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error adding note'
    });
  }
});

// @route   POST /api/alerts
// @desc    Create a new alert (for testing/manual entry)
// @access  Private (Admin)
router.post('/', protect, authorize('admin', 'user'), async (req, res) => {
  try {
    const alert = await Alert.create(req.body);

    // Emit to WebSocket
    const io = req.app.get('io');
    io.emit('alert:new', alert);

    // Send notifications
    try {
      const notificationService = require('../services/notification');
      await notificationService.sendNotifications(alert);
    } catch (notifError) {
      logger.error('Notification error:', notifError.message);
    }

    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Create alert error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating alert'
    });
  }
});

// @route   DELETE /api/alerts/:id
// @desc    Delete an alert
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted'
    });
  } catch (error) {
    logger.error('Delete alert error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting alert'
    });
  }
});

module.exports = router;

