/**
 * Anomaly Detection Service
 * ML-based anomaly detection for logs and metrics
 */

const Anomaly = require('../models/Anomaly');
const Log = require('../models/Log');
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

class AnomalyDetectionService {
  constructor() {
    this.settings = null;
  }

  /**
   * Initialize anomaly detection settings
   */
  async initialize() {
    try {
      const settings = await Settings.findOne({ key: 'anomalyDetection' });
      if (settings) {
        this.settings = settings.value;
        logger.info('Anomaly detection service initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize anomaly detection:', error.message);
    }
  }

  /**
   * Detect anomalies in recent logs using rule-based approach
   */
  async detectAnomalies() {
    if (!this.settings?.enabled) {
      return [];
    }

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentLogs = await Log.find({
        timestamp: { $gte: oneHourAgo },
        isAnomaly: true
      }).lean();

      const anomalies = [];

      for (const log of recentLogs) {
        // Check if anomaly already exists for this log
        const existing = await Anomaly.findOne({ logId: log._id });
        if (existing) continue;

        const anomaly = this.classifyLogAnomaly(log);
        if (anomaly) {
          const created = await Anomaly.create(anomaly);
          anomalies.push(created);

          // Create alert for critical/high anomalies
          if (['critical', 'high'].includes(created.severity)) {
            const alert = await Alert.create({
              title: `Anomaly: ${created.title}`,
              message: created.description,
              severity: created.severity,
              category: created.type,
              source: 'anomaly',
              anomalyId: created._id
            });
            created.relatedAlerts = [alert._id];
            await created.save();
          }
        }
      }

      return anomalies;
    } catch (error) {
      logger.error('Anomaly detection error:', error.message);
      return [];
    }
  }

  /**
   * Classify log entry as anomaly based on patterns
   */
  classifyLogAnomaly(log) {
    const patterns = {
      slow_query: {
        type: 'performance',
        severityMap: { WARNING: 'high', ERROR: 'critical' },
        title: 'Slow Query Detected',
        description: `Query execution took longer than expected: ${log.message}`
      },
      auth_failure: {
        type: 'security',
        severityMap: { WARNING: 'high', ERROR: 'critical' },
        title: 'Authentication Failure',
        description: `Multiple authentication failures detected: ${log.message}`
      },
      unauthorized_access: {
        type: 'security',
        severityMap: { WARNING: 'critical', ERROR: 'critical' },
        title: 'Unauthorized Access Attempt',
        description: `Unauthorized operation detected: ${log.message}`
      },
      connection_spike: {
        type: 'connection',
        severityMap: { WARNING: 'high', ERROR: 'critical' },
        title: 'Connection Spike',
        description: `Abnormal connection spike detected: ${log.message}`
      },
      memory_issue: {
        type: 'resource',
        severityMap: { WARNING: 'high', ERROR: 'critical' },
        title: 'Memory Issue',
        description: `High memory usage detected: ${log.message}`
      },
      disk_issue: {
        type: 'capacity',
        severityMap: { WARNING: 'critical', ERROR: 'critical' },
        title: 'Disk Space Critical',
        description: `Disk space issue detected: ${log.message}`
      },
      replication_error: {
        type: 'replication',
        severityMap: { WARNING: 'high', ERROR: 'critical' },
        title: 'Replication Error',
        description: `Replication synchronization issue: ${log.message}`
      }
    };

    const pattern = patterns[log.classification];
    if (!pattern) return null;

    const severity = pattern.severityMap[log.severity] || 'medium';
    if (severity === 'medium') return null; // Skip medium/low severity

    return {
      logId: log._id,
      timestamp: log.timestamp,
      severity,
      type: pattern.type,
      title: pattern.title,
      description: pattern.description,
      details: {
        logMessage: log.message,
        component: log.component,
        severity: log.severity,
        classification: log.classification
      },
      anomalyScore: log.anomalyScore || 0.75,
      algorithm: 'rule_based',
      confidence: 0.85,
      recommendedAction: this.getRecommendedAction(pattern.type, log.classification)
    };
  }

  /**
   * Get recommended action based on anomaly type
   */
  getRecommendedAction(type, classification) {
    const actions = {
      performance: 'Analyze query execution plans and optimize indexes. Check for long-running operations.',
      security: 'Review authentication logs and restrict access from suspicious IPs. Consider enabling MFA.',
      capacity: 'Monitor disk usage closely and plan capacity increase. Archive or delete old data if needed.',
      connection: 'Check connection pooling settings and server load. Investigate for DDoS attacks.',
      resource: 'Review system resources and running processes. Consider scaling up hardware resources.',
      replication: 'Verify network connectivity between replica nodes. Check for latency or packet loss.'
    };

    return actions[type] || 'Manual investigation required.';
  }

  /**
   * Get anomaly statistics
   */
  async getAnomalyStats() {
    try {
      const [
        total,
        unresolved,
        byType,
        bySeverity,
        recentAnomalies
      ] = await Promise.all([
        Anomaly.countDocuments(),
        Anomaly.countDocuments({ isResolved: false }),
        Anomaly.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        Anomaly.aggregate([
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]),
        Anomaly.find({ isResolved: false })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      ]);

      return {
        total,
        unresolved,
        byType: byType.reduce((acc, t) => {
          acc[t._id] = t.count;
          return acc;
        }, {}),
        bySeverity: bySeverity.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        recent: recentAnomalies
      };
    } catch (error) {
      logger.error('Anomaly stats error:', error.message);
      return null;
    }
  }

  /**
   * Batch resolve similar anomalies
   */
  async resolveSimilarAnomalies(anomalyId, userId) {
    try {
      const anomaly = await Anomaly.findById(anomalyId);
      if (!anomaly) return null;

      const result = await Anomaly.updateMany(
        {
          type: anomaly.type,
          severity: anomaly.severity,
          isResolved: false,
          timestamp: {
            $gte: new Date(anomaly.timestamp.getTime() - 60 * 60 * 1000),
            $lte: new Date(anomaly.timestamp.getTime() + 60 * 60 * 1000)
          }
        },
        {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: userId
        }
      );

      logger.info(`Resolved ${result.modifiedCount} similar anomalies`);
      return result;
    } catch (error) {
      logger.error('Resolve similar anomalies error:', error.message);
      return null;
    }
  }

  /**
   * Auto-resolve old anomalies
   */
  async autoResolveOldAnomalies(gracePeriodDays = 7) {
    try {
      const cutoff = new Date(Date.now() - gracePeriodDays * 24 * 60 * 60 * 1000);
      const result = await Anomaly.updateMany(
        {
          isResolved: false,
          createdAt: { $lt: cutoff }
        },
        {
          isResolved: true,
          resolvedAt: new Date()
        }
      );

      logger.info(`Auto-resolved ${result.modifiedCount} old anomalies`);
      return result;
    } catch (error) {
      logger.error('Auto-resolve anomalies error:', error.message);
      return null;
    }
  }
}

module.exports = new AnomalyDetectionService();
