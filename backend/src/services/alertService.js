/**
 * Alert Service
 * Handles alert generation, threshold checking, and management
 */

const Alert = require('../models/Alert');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');
const notificationService = require('./notification');

class AlertService {
  /**
   * Check if value exceeds threshold and create alert
   */
  async checkTresholdAndAlert(metricName, value, thresholdKey, options = {}) {
    try {
      const settings = await Settings.findOne({ key: 'alertThresholds' });
      if (!settings) return null;

      const thresholds = settings.value;
      const threshold = thresholds[thresholdKey];

      if (!threshold || value <= threshold) {
        return null;
      }

      // Create alert for threshold breach
      const severityMap = {
        slowQueryMs: 'high',
        connectionSpikeThreshold: 'high',
        errorRateThreshold: 'high',
        memoryUsagePercent: 'critical',
        diskUsagePercent: 'critical',
        replicationLagSeconds: 'high'
      };

      const categoryMap = {
        slowQueryMs: 'performance',
        connectionSpikeThreshold: 'connection',
        errorRateThreshold: 'system',
        memoryUsagePercent: 'resource',
        diskUsagePercent: 'resource',
        replicationLagSeconds: 'replication'
      };

      const alert = await Alert.create({
        title: `Threshold Alert: ${metricName}`,
        message: `${metricName} exceeded threshold. Current: ${value}, Threshold: ${threshold}`,
        severity: severityMap[thresholdKey] || 'medium',
        category: categoryMap[thresholdKey] || 'system',
        source: 'rule',
        metadata: {
          metric: metricName,
          currentValue: value,
          threshold: threshold,
          ...options
        }
      });

      // Send notifications
      try {
        await notificationService.sendNotifications(alert);
      } catch (notifError) {
        logger.error('Notification error:', notifError.message);
      }

      return alert;
    } catch (error) {
      logger.error('Alert threshold check error:', error.message);
      return null;
    }
  }

  /**
   * Bulk create alerts for multiple conditions
   */
  async createBulkAlerts(conditions) {
    const alerts = [];
    for (const condition of conditions) {
      try {
        const alert = await Alert.create(condition);
        alerts.push(alert);

        // Send notifications
        try {
          await notificationService.sendNotifications(alert);
        } catch (notifError) {
          logger.error('Notification error for bulk alert:', notifError.message);
        }
      } catch (error) {
        logger.error('Bulk alert creation error:', error.message);
      }
    }
    return alerts;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats() {
    try {
      const [
        total,
        byStatus,
        bySeverity,
        byCategory,
        unresolvedCount,
        criticalCount
      ] = await Promise.all([
        Alert.countDocuments(),
        Alert.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Alert.aggregate([
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]),
        Alert.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        Alert.countDocuments({ status: { $ne: 'resolved' } }),
        Alert.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } })
      ]);

      return {
        total,
        byStatus: byStatus.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        bySeverity: bySeverity.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        byCategory: byCategory.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        unresolved: unresolvedCount,
        critical: criticalCount
      };
    } catch (error) {
      logger.error('Alert stats error:', error.message);
      return null;
    }
  }

  /**
   * Auto-resolve old alerts (configurable grace period)
   */
  async autoResolveOldAlerts(gracePeriodHours = 72) {
    try {
      const cutoff = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);
      const result = await Alert.updateMany(
        {
          status: { $ne: 'resolved' },
          createdAt: { $lt: cutoff },
          source: { $ne: 'manual' }
        },
        {
          status: 'resolved',
          resolvedAt: new Date()
        }
      );

      logger.info(`Auto-resolved ${result.modifiedCount} old alerts`);
      return result;
    } catch (error) {
      logger.error('Auto-resolve error:', error.message);
      return null;
    }
  }

  /**
   * Clean up dismissed/old demo alerts
   */
  async cleanupAlerts(options = {}) {
    const {
      olderThanDays = 30,
      status = null,
      source = null
    } = options;

    try {
      const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      const query = { createdAt: { $lt: cutoff } };

      if (status) query.status = status;
      if (source) query.source = source;

      const result = await Alert.deleteMany(query);
      logger.info(`Cleaned up ${result.deletedCount} alerts`);
      return result;
    } catch (error) {
      logger.error('Alert cleanup error:', error.message);
      return null;
    }
  }
}

module.exports = new AlertService();
