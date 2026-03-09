/**
 * Settings Management Routes
 * Extended routes for managing Alert Thresholds, Notifications, Anomaly Detection, Demo Data, and Security
 */

const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const Settings = require('../models/Settings');
const alertService = require('../services/alertService');
const anomalyService = require('../services/anomalyService');
const securityService = require('../services/securityService');
const rbacService = require('../services/rbacService');
const logger = require('../utils/logger');

// ============= ALERT THRESHOLDS =============

/**
 * @route   GET /api/settings/categories/alert-thresholds
 * @desc    Get current alert thresholds
 * @access  Private
 */
router.get('/categories/alert-thresholds', protect, async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: 'alertThresholds' }).lean();
    const alertStats = await alertService.getAlertStats();

    res.json({
      success: true,
      data: {
        settings: settings?.value || {},
        stats: alertStats,
        description: 'Configure thresholds for automatic alert generation'
      }
    });
  } catch (error) {
    logger.error('Get alert thresholds error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching alert thresholds' });
  }
});

/**
 * @route   PUT /api/settings/categories/alert-thresholds
 * @desc    Update alert thresholds
 * @access  Private (Admin)
 */
router.put('/categories/alert-thresholds', protect, authorize('admin'), async (req, res) => {
  try {
    const { slowQueryMs, connectionSpikeThreshold, errorRateThreshold, memoryUsagePercent, diskUsagePercent, replicationLagSeconds } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key: 'alertThresholds' },
      {
        $set: {
          value: {
            slowQueryMs,
            connectionSpikeThreshold,
            errorRateThreshold,
            memoryUsagePercent,
            diskUsagePercent,
            replicationLagSeconds
          },
          updatedBy: req.user._id
        }
      },
      { new: true, runValidators: true }
    );

    await securityService.auditLog('UPDATE_ALERT_THRESHOLDS', req.user._id, 'settings');

    res.json({ success: true, data: setting });
  } catch (error) {
    logger.error('Update alert thresholds error:', error.message);
    res.status(500).json({ success: false, message: 'Error updating alert thresholds' });
  }
});

/**
 * @route   GET /api/settings/categories/alert-thresholds/test
 * @desc    Test alert threshold by simulating a breach
 * @access  Private (Admin)
 */
router.post('/categories/alert-thresholds/test', protect, authorize('admin'), async (req, res) => {
  try {
    const { thresholdKey, value } = req.body;

    const alert = await alertService.checkTresholdAndAlert(
      `Test: ${thresholdKey}`,
      value,
      thresholdKey,
      { test: true }
    );

    res.json({
      success: true,
      data: { alert, message: 'Test alert created successfully' }
    });
  } catch (error) {
    logger.error('Test alert error:', error.message);
    res.status(500).json({ success: false, message: 'Error testing alert' });
  }
});

// ============= NOTIFICATIONS =============

/**
 * @route   GET /api/settings/categories/notifications
 * @desc    Get notification settings
 * @access  Private
 */
router.get('/categories/notifications', protect, async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: 'notificationSettings' }).lean();

    // Mask sensitive data for non-admin
    let notificationSettings = settings?.value || {};
    if (req.user.role !== 'admin') {
      notificationSettings = {
        ...notificationSettings,
        email: { ...notificationSettings.email, smtpPass: '***' },
        slack: { ...notificationSettings.slack, webhookUrl: notificationSettings.slack.webhookUrl?.substring(0, 20) + '***' },
        telegram: { ...notificationSettings.telegram, botToken: notificationSettings.telegram.botToken?.substring(0, 10) + '***' }
      };
    }

    res.json({
      success: true,
      data: {
        settings: notificationSettings,
        channels: ['email', 'slack', 'telegram'],
        description: 'Configure notification channels for alerts'
      }
    });
  } catch (error) {
    logger.error('Get notification settings error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching notification settings' });
  }
});

/**
 * @route   PUT /api/settings/categories/notifications
 * @desc    Update notification settings
 * @access  Private (Admin)
 */
router.put('/categories/notifications', protect, authorize('admin'), async (req, res) => {
  try {
    const { email, slack, telegram } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key: 'notificationSettings' },
      {
        $set: {
          value: { email, slack, telegram },
          updatedBy: req.user._id
        }
      },
      { new: true, runValidators: true }
    );

    await securityService.auditLog('UPDATE_NOTIFICATIONS', req.user._id, 'settings', { channels: Object.keys({ email, slack, telegram }) });

    res.json({ success: true, data: setting });
  } catch (error) {
    logger.error('Update notification settings error:', error.message);
    res.status(500).json({ success: false, message: 'Error updating notification settings' });
  }
});

/**
 * @route   POST /api/settings/categories/notifications/test
 * @desc    Send test notification to configured channels
 * @access  Private (Admin)
 */
router.post('/categories/notifications/test', protect, authorize('admin'), async (req, res) => {
  try {
    const notificationService = require('../services/notification');

    const testAlert = {
      _id: 'test-' + Date.now(),
      title: 'Test Notification',
      message: 'This is a test notification from MongoDB Log Monitor',
      severity: 'info',
      category: 'system',
      createdAt: new Date()
    };

    const results = await notificationService.sendNotifications(testAlert);

    res.json({
      success: true,
      data: {
        results,
        message: 'Test notifications sent to all configured channels'
      }
    });
  } catch (error) {
    logger.error('Test notification error:', error.message);
    res.status(500).json({ success: false, message: 'Error sending test notifications' });
  }
});

// ============= ANOMALY DETECTION =============

/**
 * @route   GET /api/settings/categories/anomaly-detection
 * @desc    Get anomaly detection settings
 * @access  Private
 */
router.get('/categories/anomaly-detection', protect, async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: 'anomalyDetection' }).lean();
    const anomalyStats = await anomalyService.getAnomalyStats();

    res.json({
      success: true,
      data: {
        settings: settings?.value || {},
        stats: anomalyStats,
        algorithms: ['rule_based', 'isolation_forest', 'lof', 'autoencoder'],
        description: 'Configure ML-based anomaly detection'
      }
    });
  } catch (error) {
    logger.error('Get anomaly settings error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching anomaly settings' });
  }
});

/**
 * @route   PUT /api/settings/categories/anomaly-detection
 * @desc    Update anomaly detection settings
 * @access  Private (Admin)
 */
router.put('/categories/anomaly-detection', protect, authorize('admin'), async (req, res) => {
  try {
    const { enabled, algorithm, contamination, n_estimators, modelUpdateInterval } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key: 'anomalyDetection' },
      {
        $set: {
          value: {
            enabled,
            algorithm,
            contamination: Math.min(Math.max(contamination, 0.01), 0.5),
            n_estimators: Math.max(n_estimators, 10),
            modelUpdateInterval
          },
          updatedBy: req.user._id
        }
      },
      { new: true, runValidators: true }
    );

    if (enabled) {
      await anomalyService.initialize();
    }

    await securityService.auditLog('UPDATE_ANOMALY_DETECTION', req.user._id, 'settings');

    res.json({ success: true, data: setting });
  } catch (error) {
    logger.error('Update anomaly settings error:', error.message);
    res.status(500).json({ success: false, message: 'Error updating anomaly settings' });
  }
});

/**
 * @route   POST /api/settings/categories/anomaly-detection/run
 * @desc    Manually trigger anomaly detection
 * @access  Private (Admin)
 */
router.post('/categories/anomaly-detection/run', protect, authorize('admin'), async (req, res) => {
  try {
    const anomalies = await anomalyService.detectAnomalies();

    res.json({
      success: true,
      data: {
        anomaliesDetected: anomalies.length,
        anomalies: anomalies
      }
    });
  } catch (error) {
    logger.error('Run anomaly detection error:', error.message);
    res.status(500).json({ success: false, message: 'Error running anomaly detection' });
  }
});

// ============= SECURITY =============

/**
 * @route   GET /api/settings/categories/security
 * @desc    Get security settings
 * @access  Private (Admin)
 */
router.get('/categories/security', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: 'security' }).lean();
    const securityReport = await securityService.generateSecurityReport();

    res.json({
      success: true,
      data: {
        settings: settings?.value || {},
        report: securityReport,
        description: 'Configure security policies and access control'
      }
    });
  } catch (error) {
    logger.error('Get security settings error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching security settings' });
  }
});

/**
 * @route   PUT /api/settings/categories/security
 * @desc    Update security settings
 * @access  Private (Admin)
 */
router.put('/categories/security', protect, authorize('admin'), async (req, res) => {
  try {
    const { sessionTimeout, maxLoginAttempts, passwordMinLength, requireMFA } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key: 'security' },
      {
        $set: {
          value: {
            sessionTimeout,
            maxLoginAttempts: Math.max(maxLoginAttempts, 1),
            passwordMinLength: Math.max(passwordMinLength, 6),
            requireMFA
          },
          updatedBy: req.user._id
        }
      },
      { new: true, runValidators: true }
    );

    await securityService.initialize();
    await securityService.auditLog('UPDATE_SECURITY_SETTINGS', req.user._id, 'settings');

    res.json({ success: true, data: setting });
  } catch (error) {
    logger.error('Update security settings error:', error.message);
    res.status(500).json({ success: false, message: 'Error updating security settings' });
  }
});

/**
 * @route   GET /api/settings/categories/security/audit-log
 * @desc    Get audit log
 * @access  Private (Admin)
 */
router.get('/categories/security/audit-log', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, userId, resource, limit = 100 } = req.query;

    const filters = {};
    if (action) filters.action = action;
    if (userId) filters.userId = userId;
    if (resource) filters.resource = resource;

    const auditLog = securityService.getAuditLog(filters).slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        logs: auditLog,
        count: auditLog.length,
        description: 'System audit log of all user actions'
      }
    });
  } catch (error) {
    logger.error('Get audit log error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching audit log' });
  }
});

/**
 * @route   POST /api/settings/categories/security/password-validation
 * @desc    Validate password strength
 * @access  Private
 */
router.post('/categories/security/password-validation', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const validation = securityService.validatePasswordStrength(password);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Password validation error:', error.message);
    res.status(500).json({ success: false, message: 'Error validating password' });
  }
});

module.exports = router;
