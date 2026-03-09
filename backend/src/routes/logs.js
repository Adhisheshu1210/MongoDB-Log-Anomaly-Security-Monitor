/**
 * Log Routes
 * Handles log retrieval, filtering, and management
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Log = require('../models/Log');
const logger = require('../utils/logger');

// @route   GET /api/logs
// @desc    Get all logs with filtering and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      component,
      classification,
      isAnomaly,
      startDate,
      endDate,
      search,
      sort = '-timestamp'
    } = req.query;

    // Build query
    const query = {};

    if (severity) {
      query.severity = { $in: severity.split(',') };
    }

    if (component) {
      query.component = { $in: component.split(',') };
    }

    if (classification) {
      query.classification = { $in: classification.split(',') };
    }

    if (isAnomaly !== undefined) {
      query.isAnomaly = isAnomaly === 'true';
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const logs = await Log.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Log.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get logs error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs'
    });
  }
});

// @route   GET /api/logs/:id
// @desc    Get single log by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const log = await Log.findById(req.params.id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    logger.error('Get log error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching log'
    });
  }
});

// @route   GET /api/logs/recent
// @desc    Get recent logs (real-time feed)
// @access  Private
router.get('/recent/:limit', protect, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 50;
    
    const logs = await Log.find()
      .sort('-timestamp')
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Get recent logs error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent logs'
    });
  }
});

// @route   POST /api/logs
// @desc    Create a new log entry (for testing/manual entry)
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const log = await Log.create(req.body);

    // Emit to WebSocket
    const io = req.app.get('io');
    io.emit('log:new', log);

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    logger.error('Create log error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating log'
    });
  }
});

// @route   DELETE /api/logs/:id
// @desc    Delete a log entry
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const log = await Log.findByIdAndDelete(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      message: 'Log deleted'
    });
  } catch (error) {
    logger.error('Delete log error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting log'
    });
  }
});

// @route   DELETE /api/logs
// @desc    Delete logs by filter
// @access  Private (Admin)
router.delete('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, severity, olderThanDays } = req.query;
    
    const query = {};

    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
      query.timestamp = { $lt: cutoffDate };
    } else if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (severity) {
      query.severity = severity;
    }

    const result = await Log.deleteMany(query);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} logs`
    });
  } catch (error) {
    logger.error('Delete logs error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting logs'
    });
  }
});

module.exports = router;

