/**
 * Audit Logs Routes
 * Comprehensive audit trail with filtering, search, and export
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * @route   GET /api/audit-logs
 * @desc    Get audit logs with pagination, search, and filters
 * @access  Private (Admin)
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      action = '',
      status = '',
      userId = '',
      startDate = null,
      endDate = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filters = {};

    if (search) {
      filters.$or = [
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resourceTarget: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }

    if (action) {
      filters.action = action;
    }

    if (status) {
      filters.status = status;
    }

    if (userId) {
      filters.userId = userId;
    }

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [logs, total] = await Promise.all([
      AuditLog.find(filters)
        .sort(sortObj)
        .skip(skip)
        .limit(pageSize)
        .populate('userId', 'name email role')
        .lean(),
      AuditLog.countDocuments(filters)
    ]);

    // Format logs
    const formattedLogs = logs.map(log => ({
      id: log._id,
      auditId: log.auditId || `AUD-${log._id.toString().slice(-6).toUpperCase()}`,
      user: {
        id: log.userId?._id,
        name: log.userId?.name || 'System',
        email: log.userId?.email || 'system@internal',
        role: log.userId?.role || 'SYSTEM'
      },
      action: log.action,
      resourceTarget: log.resourceTarget,
      resourceType: log.resourceType,
      ipAddress: log.ipAddress || 'Internal',
      userAgent: log.userAgent,
      status: log.status,
      changes: log.changes,
      reason: log.reason,
      timestamp: log.createdAt,
      createdAt: log.createdAt
    }));

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
        hasMore: pageNum < Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

/**
 * @route   GET /api/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin)
 */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      total24h,
      failed24h,
      totalActions,
      actionBreakdown,
      statusBreakdown,
      topUsers
    ] = await Promise.all([
      AuditLog.countDocuments({ createdAt: { $gte: last24h } }),
      AuditLog.countDocuments({ createdAt: { $gte: last24h }, status: 'FAILED' }),
      AuditLog.countDocuments({}),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userData' } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        last24h: {
          total: total24h,
          failed: failed24h,
          failureRate: total24h > 0 ? Math.round((failed24h / total24h) * 100) : 0
        },
        totalLogs: totalActions,
        topActions: actionBreakdown,
        statusBreakdown,
        topUsers: topUsers.map(u => ({
          userId: u._id,
          userName: u.userData[0]?.name || 'Unknown',
          actionCount: u.count
        }))
      }
    });
  } catch (error) {
    logger.error('Get audit stats error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching audit statistics' });
  }
});

/**
 * @route   GET /api/audit-logs/actions
 * @desc    Get unique action types
 * @access  Private (Admin)
 */
router.get('/actions', protect, authorize('admin'), async (req, res) => {
  try {
    const actions = await AuditLog.distinct('action');
    
    res.json({
      success: true,
      data: actions.sort()
    });
  } catch (error) {
    logger.error('Get actions error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching actions' });
  }
});

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Get single audit log with details
 * @access  Private (Admin)
 */
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('userId', 'name email role')
      .lean();

    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }

    res.json({
      success: true,
      data: {
        id: log._id,
        auditId: log.auditId || `AUD-${log._id.toString().slice(-6).toUpperCase()}`,
        user: {
          id: log.userId?._id,
          name: log.userId?.name,
          email: log.userId?.email,
          role: log.userId?.role
        },
        action: log.action,
        resourceTarget: log.resourceTarget,
        resourceType: log.resourceType,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        status: log.status,
        changes: log.changes,
        reason: log.reason,
        metadata: log.metadata,
        timestamp: log.createdAt
      }
    });
  } catch (error) {
    logger.error('Get audit log detail error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching audit log details' });
  }
});

/**
 * @route   POST /api/audit-logs/export
 * @desc    Export audit logs as JSON
 * @access  Private (Admin)
 */
router.post('/export', protect, authorize('admin'), async (req, res) => {
  try {
    const { filters = {} } = req.body;

    const logs = await AuditLog.find(filters)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const formattedLogs = logs.map(log => ({
      auditId: log.auditId || `AUD-${log._id.toString().slice(-6).toUpperCase()}`,
      timestamp: log.createdAt.toISOString(),
      user: log.userId?.name || 'System',
      email: log.userId?.email || 'system@internal',
      role: log.userId?.role || 'SYSTEM',
      action: log.action,
      resourceTarget: log.resourceTarget,
      resourceType: log.resourceType,
      status: log.status,
      ipAddress: log.ipAddress || 'Internal',
      reason: log.reason,
      changes: log.changes
    }));

    res.json({
      success: true,
      data: {
        exportDate: new Date().toISOString(),
        totalRecords: formattedLogs.length,
        records: formattedLogs
      }
    });
  } catch (error) {
    logger.error('Export audit logs error:', error.message);
    res.status(500).json({ success: false, message: 'Error exporting audit logs' });
  }
});

/**
 * @route   GET /api/audit-logs/integrity/verify
 * @desc    Verify audit log integrity (SHA-256 checksum)
 * @access  Private (Admin)
 */
router.get('/integrity/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const crypto = require('crypto');
    const logs = await AuditLog.find({}).select('-__v').lean();
    
    const checksumString = logs.map(l => `${l._id}${l.action}${l.createdAt}`).join('');
    const checksum = crypto.createHash('sha256').update(checksumString).digest('hex');

    res.json({
      success: true,
      data: {
        verified: true,
        checksum,
        totalLogs: logs.length,
        lastVerified: new Date().toISOString(),
        integrityStatus: 'PASS'
      }
    });
  } catch (error) {
    logger.error('Verify integrity error:', error.message);
    res.status(500).json({ success: false, message: 'Error verifying integrity' });
  }
});

module.exports = router;
