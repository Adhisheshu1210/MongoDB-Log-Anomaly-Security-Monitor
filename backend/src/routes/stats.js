/**
 * Statistics Routes
 * Provides dashboard statistics and analytics
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Log = require('../models/Log');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');
const User = require('../models/User');
const logger = require('../utils/logger');

// @route   GET /api/stats/dashboard
// @desc    Get dashboard summary statistics
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get current stats
    const [
      totalLogs,
      totalAnomalies,
      unresolvedAnomalies,
      totalAlerts,
      activeAlerts,
      criticalAlerts
    ] = await Promise.all([
      Log.countDocuments(),
      Anomaly.countDocuments(),
      Anomaly.countDocuments({ isResolved: false }),
      Alert.countDocuments(),
      Alert.countDocuments({ status: { $ne: 'resolved' } }),
      Alert.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } })
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayLogs,
      todayAnomalies,
      todayAlerts
    ] = await Promise.all([
      Log.countDocuments({ timestamp: { $gte: today } }),
      Anomaly.countDocuments({ timestamp: { $gte: today } }),
      Alert.countDocuments({ createdAt: { $gte: today } })
    ]);

    // Get last hour stats
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [
      lastHourLogs,
      lastHourAnomalies
    ] = await Promise.all([
      Log.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      Anomaly.countDocuments({ timestamp: { $gte: oneHourAgo } })
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        totalAnomalies,
        unresolvedAnomalies,
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        todayLogs,
        todayAnomalies,
        todayAlerts,
        lastHourLogs,
        lastHourAnomalies
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// @route   GET /api/stats/logs-by-level
// @desc    Get log count by severity level
// @access  Private
router.get('/logs-by-level', protect, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'severity' } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const results = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: `$${groupBy}`,
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Get logs by level error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching log statistics'
    });
  }
});

// @route   GET /api/stats/logs-by-time
// @desc    Get log count over time
// @access  Private
router.get('/logs-by-time', protect, async (req, res) => {
  try {
    const { interval = 'hour', startDate, endDate, limit = 24 } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Determine date format based on interval
    let dateFormat;
    switch (interval) {
      case 'minute':
        dateFormat = '%Y-%m-%d %H:%M';
        break;
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      default:
        dateFormat = '%Y-%m-%d %H:00';
    }

    const results = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Get logs by time error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching log time statistics'
    });
  }
});

// @route   GET /api/stats/anomalies-by-type
// @desc    Get anomaly count by type
// @access  Private
router.get('/anomalies-by-type', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const results = await Anomaly.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgScore: { $avg: '$anomalyScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Get anomalies by type error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching anomaly statistics'
    });
  }
});

// @route   GET /api/stats/anomalies-by-severity
// @desc    Get anomaly count by severity
// @access  Private
router.get('/anomalies-by-severity', protect, async (req, res) => {
  try {
    const results = await Anomaly.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Get anomalies by severity error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching anomaly severity statistics'
    });
  }
});

// @route   GET /api/stats/logs-by-component
// @desc    Get log count by component
// @access  Private
router.get('/logs-by-component', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const results = await Log.aggregate([
      {
        $group: {
          _id: '$component',
          count: { $sum: 1 },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'ERROR'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Get logs by component error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching component statistics'
    });
  }
});

// @route   GET /api/stats/classification
// @desc    Get log classification breakdown
// @access  Private
router.get('/classification', protect, async (req, res) => {
  try {
    const results = await Log.aggregate([
      {
        $group: {
          _id: '$classification',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Get classification stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching classification statistics'
    });
  }
});

// @route   GET /api/stats/top-anomalies
// @desc    Get top anomalies by score
// @access  Private
router.get('/top-anomalies', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const anomalies = await Anomaly.find({ isResolved: false })
      .sort('-anomalyScore')
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    logger.error('Get top anomalies error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching top anomalies'
    });
  }
});

// @route   GET /api/stats/report
// @desc    Generate comprehensive system report
// @access  Private (Admin only)
router.get('/report', protect, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Get date ranges
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all statistics in parallel
    const [
      // Overview stats
      totalStats,
      todayStats,
      last7DaysStats,
      
      // Logs breakdown
      logsBySeverity,
      logsByComponent,
      logsByClassification,
      
      // Anomalies breakdown
      anomaliesByType,
      anomaliesBySeverity,
      anomalyStatusCounts,
      
      // Alerts breakdown
      alertsByCategory,
      alertsBySeverity,
      alertStatusCounts,
      
      // Recent samples
      recentLogs,
      recentAnomalies,
      recentAlerts,
      
      // User stats
      totalUsers,
      usersByRole
    ] = await Promise.all([
      // Overview stats
      Promise.all([
        Log.countDocuments(),
        Anomaly.countDocuments(),
        Alert.countDocuments(),
        Anomaly.countDocuments({ isResolved: false }),
        Alert.countDocuments({ status: { $ne: 'resolved' } })
      ]),
      Promise.all([
        Log.countDocuments({ timestamp: { $gte: today } }),
        Anomaly.countDocuments({ timestamp: { $gte: today } }),
        Alert.countDocuments({ createdAt: { $gte: today } })
      ]),
      Promise.all([
        Log.countDocuments({ timestamp: { $gte: last7Days } }),
        Anomaly.countDocuments({ timestamp: { $gte: last7Days } }),
        Alert.countDocuments({ createdAt: { $gte: last7Days } })
      ]),
      
      // Logs breakdown
      Log.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Log.aggregate([
        { $group: { _id: '$component', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Log.aggregate([
        { $group: { _id: '$classification', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Anomalies breakdown
      Anomaly.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Anomaly.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Anomaly.aggregate([
        { $group: { _id: '$isResolved', count: { $sum: 1 } } }
      ]),
      
      // Alerts breakdown
      Alert.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Alert.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Recent samples
      Log.find().sort({ timestamp: -1 }).limit(20).lean(),
      Anomaly.find().sort({ timestamp: -1 }).limit(10).lean(),
      Alert.find().sort({ createdAt: -1 }).limit(10).lean(),
      
      // User stats
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    // Format the report
    const report = {
      generatedAt: new Date().toISOString(),
      reportPeriod: {
        from: last30Days.toISOString(),
        to: new Date().toISOString(),
        last7Days: last7Days.toISOString(),
        today: today.toISOString()
      },
      overview: {
        totalLogs: totalStats[0],
        totalAnomalies: totalStats[1],
        totalAlerts: totalStats[2],
        unresolvedAnomalies: totalStats[3],
        activeAlerts: totalStats[4],
        today: {
          logs: todayStats[0],
          anomalies: todayStats[1],
          alerts: todayStats[2]
        },
        last7Days: {
          logs: last7DaysStats[0],
          anomalies: last7DaysStats[1],
          alerts: last7DaysStats[2]
        }
      },
      logs: {
        bySeverity: logsBySeverity,
        byComponent: logsByComponent,
        byClassification: logsByClassification,
        recent: recentLogs.map(log => ({
          timestamp: log.timestamp,
          severity: log.severity,
          component: log.component,
          message: log.message?.substring(0, 200),
          classification: log.classification,
          isAnomaly: log.isAnomaly
        }))
      },
      anomalies: {
        byType: anomaliesByType,
        bySeverity: anomaliesBySeverity,
        status: {
          unresolved: anomalyStatusCounts.find(s => s._id === false)?.count || 0,
          resolved: anomalyStatusCounts.find(s => s._id === true)?.count || 0
        },
        recent: recentAnomalies.map(anomaly => ({
          timestamp: anomaly.timestamp,
          severity: anomaly.severity,
          type: anomaly.type,
          title: anomaly.title,
          anomalyScore: anomaly.anomalyScore,
          isResolved: anomaly.isResolved
        }))
      },
      alerts: {
        byCategory: alertsByCategory,
        bySeverity: alertsBySeverity,
        status: alertStatusCounts.reduce((acc, s) => {
          acc[s._id || 'unknown'] = s.count;
          return acc;
        }, {}),
        recent: recentAlerts.map(alert => ({
          timestamp: alert.createdAt,
          severity: alert.severity,
          category: alert.category,
          title: alert.title,
          status: alert.status
        }))
      },
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, r) => {
          acc[r._id || 'unknown'] = r.count;
          return acc;
        }, {})
      }
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvLines = [
        'Category,Metric,Value',
        `Overview,Total Logs,${report.overview.totalLogs}`,
        `Overview,Total Anomalies,${report.overview.totalAnomalies}`,
        `Overview,Total Alerts,${report.overview.totalAlerts}`,
        `Overview,Unresolved Anomalies,${report.overview.unresolvedAnomalies}`,
        `Overview,Active Alerts,${report.overview.activeAlerts}`,
        `Today,Logs,${report.overview.today.logs}`,
        `Today,Anomalies,${report.overview.today.anomalies}`,
        `Today,Alerts,${report.overview.today.alerts}`,
        `Last 7 Days,Logs,${report.overview.last7Days.logs}`,
        `Last 7 Days,Anomalies,${report.overview.last7Days.anomalies}`,
        `Last 7 Days,Alerts,${report.overview.last7Days.alerts}`,
        `Users,Total,${report.users.total}`,
        ...report.users.byRole.map(r => `Users,${r[0]},${r[1]}`)
      ];
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=system-report-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvLines.join('\n'));
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Generate report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating report'
    });
  }
});

module.exports = router;

