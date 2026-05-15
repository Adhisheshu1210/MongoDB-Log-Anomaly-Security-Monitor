/**
 * Log Routes
 * Complete MongoDB log management with filtering, pagination, and analytics
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Log = require('../models/Log');
const logger = require('../utils/logger');

/**
 * @route   GET /api/logs
 * @desc    Get all logs with advanced filtering and pagination
 * @access  Private
 * @query   page, limit, severity, component, classification, isAnomaly, startDate, endDate, search, sort
 */
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

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(500, Math.max(1, parseInt(limit)));

    // Build query
    const query = {};

    // Filter by severity (comma-separated)
    if (severity) {
      query.severity = { $in: severity.split(',') };
    }

    // Filter by component (comma-separated)
    if (component) {
      query.component = { $in: component.split(',') };
    }

    // Filter by classification (comma-separated)
    if (classification) {
      query.classification = { $in: classification.split(',') };
    }

    // Filter by anomaly status
    if (isAnomaly !== undefined) {
      query.isAnomaly = isAnomaly === 'true';
    }

    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Full-text search
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort(sort)
        .limit(pageSize)
        .skip((pageNum - 1) * pageSize)
        .lean(),
      Log.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
        hasMore: pageNum < Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/logs/stats
 * @desc    Get log statistics and analytics
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [
      totalLogs,
      anomalyCount,
      severityBreakdown,
      classificationBreakdown,
      componentBreakdown,
      recentErrors
    ] = await Promise.all([
      Log.countDocuments({ timestamp: { $gte: since } }),
      Log.countDocuments({ isAnomaly: true, timestamp: { $gte: since } }),
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$classification', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$component', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Log.find({ severity: 'ERROR', timestamp: { $gte: since } })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        period: { days, since },
        totalLogs,
        anomalyCount,
        anomalyPercentage: totalLogs > 0 ? Math.round((anomalyCount / totalLogs) * 100) : 0,
        severityBreakdown,
        classificationBreakdown,
        topComponents: componentBreakdown,
        recentErrors: recentErrors.map(e => ({
          id: e._id,
          message: e.message,
          component: e.component,
          timestamp: e.timestamp
        }))
      }
    });
  } catch (error) {
    logger.error('Get log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching log statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/logs/recent/:limit
 * @desc    Get recent logs (real-time feed)
 * @access  Private
 */
router.get('/recent/:limit', protect, async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.params.limit) || 50));

    const logs = await Log.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Get recent logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/logs/anomalies
 * @desc    Get anomalous logs with scoring
 * @access  Private
 */
router.get('/anomalies', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      minScore = 0.5,
      maxScore = 1,
      sort = '-anomalyScore'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(500, Math.max(1, parseInt(limit)));

    const query = {
      isAnomaly: true,
      anomalyScore: {
        $gte: parseFloat(minScore),
        $lte: parseFloat(maxScore)
      }
    };

    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort(sort)
        .limit(pageSize)
        .skip((pageNum - 1) * pageSize)
        .lean(),
      Log.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('Get anomalies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching anomalies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/logs/:id
 * @desc    Get single log by ID with full details
 * @access  Private
 */
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
    logger.error('Get log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/logs
 * @desc    Create a new log entry (for testing/manual entry)
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      timestamp = new Date(),
      severity = 'INFO',
      component = 'application',
      message,
      context,
      classification = 'unknown',
      raw
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const log = await Log.create({
      timestamp,
      severity,
      component,
      message,
      context,
      classification,
      raw,
      source: 'manual'
    });

    // Emit to WebSocket for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('log:new', log);
    }

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    logger.error('Create log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/logs/:id
 * @desc    Update a log entry classification or anomaly status
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const allowedUpdates = ['classification', 'isAnomaly', 'anomalyScore'];
    const updates = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const log = await Log.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).lean();

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
    logger.error('Update log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/logs/:id
 * @desc    Delete a single log entry
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
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
      message: 'Log deleted successfully'
    });
  } catch (error) {
    logger.error('Delete log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/logs
 * @desc    Delete logs by filters (bulk delete)
 * @access  Private (Admin)
 */
router.delete('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, severity, classification, olderThanDays } = req.query;

    const query = {};

    // Delete logs older than X days
    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
      query.timestamp = { $lt: cutoffDate };
    }
    // Delete logs in date range
    else if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Filter by severity
    if (severity) {
      query.severity = { $in: severity.split(',') };
    }

    // Filter by classification
    if (classification) {
      query.classification = { $in: classification.split(',') };
    }

    const result = await Log.deleteMany(query);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    logger.error('Delete logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/logs/export
 * @desc    Export logs as CSV with optional filtering
 * @access  Private
 * @example  GET /api/logs/export?format=csv&severity=ERROR
 */
router.get('/export', protect, async (req, res) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const source = (req.query.source || 'core').toLowerCase();

    if (format !== 'csv') {
      return res.status(400).json({ success: false, message: 'Only csv format supported' });
    }

    // RBAC permission check (logs:export)
    // NOTE: auth middleware already populated req.user
    const { checkPermission } = require('../middleware/auth');
    await new Promise((resolve, reject) => {
      checkPermission('logs:export')
        ({ user: req.user }, res, (err) => (err ? reject(err) : resolve()));
    });

    // Headers
    const filename = `log-stream-${source}-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    // CSV helpers
    const escapeCsv = (v) => {
      if (v === null || v === undefined) return '';
      const s = typeof v === 'string' ? v : String(v);
      const needs = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needs ? `"${escaped}"` : escaped;
    };

    const headers = [
      'id',
      'timestamp',
      'level',
      'classification',
      'isAnomaly',
      'anomalyScore',
      'source',
      'message',
      'metadataJson'
    ];

    let rows = [];

    if (source === 'siem') {
      const SiemDatasetRecord = require('../models/SiemDatasetRecord');
      const docs = await SiemDatasetRecord.find({}).sort({ timestamp: -1 }).limit(500).lean();

      rows = docs.map((doc) => {
        const metadata = doc.rawRecord || doc;
        return {
          id: String(doc._id),
          timestamp: doc.timestamp ? new Date(doc.timestamp).toISOString() : '',
          level: doc.severity || '',
          classification: doc.classification || '',
          isAnomaly: doc.isAnomaly ? 'true' : 'false',
          anomalyScore: doc.anomalyScore ?? 0,
          source: doc.source || 'siem-dataset',
          message: `${doc.classification}: ${doc.source || 'unknown'} - Anomaly: ${doc.isAnomaly ? 'Yes' : 'No'}`,
          metadataJson: JSON.stringify(metadata)
        };
      });
    } else {
      const docs = await Log.find({}).sort({ timestamp: -1 }).limit(500).lean();
      rows = docs.map((doc) => ({
        id: String(doc._id),
        timestamp: doc.timestamp ? new Date(doc.timestamp).toISOString() : '',
        level: doc.severity || doc.level || '',
        classification: doc.classification || '',
        isAnomaly: doc.isAnomaly ? 'true' : 'false',
        anomalyScore: doc.anomalyScore ?? 0,
        source: doc.source || 'mongodb',
        message: doc.message || '',
        metadataJson: JSON.stringify(doc.context || doc.metadata || {})
      }));
    }

    const csvLines = [headers.join(',')];
    for (const r of rows) {
      csvLines.push([
        escapeCsv(r.id),
        escapeCsv(r.timestamp),
        escapeCsv(r.level),
        escapeCsv(r.classification),
        escapeCsv(r.isAnomaly),
        escapeCsv(r.anomalyScore),
        escapeCsv(r.source),
        escapeCsv(r.message),
        escapeCsv(r.metadataJson)
      ].join(','));
    }

    res.status(200).send(csvLines.join('\n'));
  } catch (error) {
    logger.error('Export logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting logs', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;


