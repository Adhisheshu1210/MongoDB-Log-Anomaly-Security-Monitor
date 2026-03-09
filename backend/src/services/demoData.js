/**
 * Demo Data Service
 * Generates synthetic logs/anomalies/alerts for dashboard and testing.
 */

const Log = require('../models/Log');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');

const LOG_COMPONENTS = ['QueryExecutor', 'Network', 'Replication', 'Storage', 'Index', 'Cluster', 'Auth'];
const LOG_SEVERITIES = ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'];
const LOG_CLASSIFICATIONS = ['normal', 'slow_query', 'auth_failure', 'connection_spike', 'memory_issue', 'unknown'];
const ANOMALY_TYPES = ['performance', 'security', 'capacity', 'connection', 'query', 'resource', 'unknown'];
const ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low'];
const ALERT_CATEGORIES = ['performance', 'security', 'capacity', 'connection', 'query', 'resource', 'system', 'unknown'];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function buildDemoLog(i, now) {
  const severity = randomFrom(LOG_SEVERITIES);
  const component = randomFrom(LOG_COMPONENTS);
  const classification = randomFrom(LOG_CLASSIFICATIONS);

  // Keep logs recent so dashboard "today" and "last hour" metrics are populated.
  const minutesAgo = i % 180;
  const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);

  let message;
  if (classification === 'slow_query') {
    message = `Slow query detected: query took ${Math.floor(Math.random() * 5000)}ms`;
  } else if (classification === 'auth_failure') {
    message = `Authentication failed for user 'admin' from ${Math.random().toString(36).substring(2, 8)}.example.com`;
  } else if (classification === 'connection_spike') {
    message = `Connection spike detected: ${Math.floor(Math.random() * 500)} concurrent connections`;
  } else if (classification === 'memory_issue') {
    message = `Memory usage high: ${Math.floor(Math.random() * 30) + 70}%`;
  } else {
    message = `Log entry ${i + 1}: ${component} operation completed`;
  }

  return {
    timestamp,
    severity,
    component,
    message,
    classification,
    isAnomaly: Math.random() > 0.78,
    anomalyScore: Math.random(),
    demo: true
  };
}

async function generateDemoData({ logsCount = 120, anomaliesCount = 24, alertsCount = 12 } = {}) {
  const now = new Date();

  const demoLogs = Array.from({ length: logsCount }, (_, i) => buildDemoLog(i, now));
  if (demoLogs.length > 0) {
    await Log.insertMany(demoLogs);
  }

  const anomalySourceLogs = await Log.find({ isAnomaly: true })
    .sort({ timestamp: -1 })
    .limit(anomaliesCount)
    .lean();

  const demoAnomalies = anomalySourceLogs.map((log) => ({
    logId: log._id,
    timestamp: log.timestamp,
    title: `${log.classification.replace('_', ' ')} anomaly detected`,
    description: `Anomaly detected in ${log.component}: ${log.message}`,
    type: randomFrom(ANOMALY_TYPES),
    severity: randomFrom(ALERT_SEVERITIES),
    anomalyScore: Math.random(),
    confidence: Math.min(1, 0.6 + Math.random() * 0.4),
    isResolved: Math.random() > 0.75,
    algorithm: 'rule_based',
    demo: true
  }));

  if (demoAnomalies.length > 0) {
    await Anomaly.insertMany(demoAnomalies);
  }

  const demoAlerts = Array.from({ length: alertsCount }, (_, i) => {
    const createdAt = new Date(now.getTime() - (i % 180) * 60 * 1000);
    const status = randomFrom(['new', 'acknowledged', 'investigating', 'resolved']);
    const severity = randomFrom(ALERT_SEVERITIES);
    const category = randomFrom(ALERT_CATEGORIES);

    return {
      title: `Demo Alert: ${category} issue detected`,
      message: `Demo alert for ${category} monitoring (${severity} severity)` ,
      severity,
      category,
      status,
      demo: true,
      createdAt,
      acknowledgedAt: status === 'acknowledged' ? new Date(createdAt.getTime() + 60 * 1000) : undefined,
      resolvedAt: status === 'resolved' ? new Date(createdAt.getTime() + 2 * 60 * 1000) : undefined
    };
  });

  if (demoAlerts.length > 0) {
    await Alert.insertMany(demoAlerts);
  }

  const [totalLogs, totalAnomalies, totalAlerts] = await Promise.all([
    Log.countDocuments(),
    Anomaly.countDocuments(),
    Alert.countDocuments()
  ]);

  return {
    logsGenerated: demoLogs.length,
    anomaliesGenerated: demoAnomalies.length,
    alertsGenerated: demoAlerts.length,
    totals: {
      logs: totalLogs,
      anomalies: totalAnomalies,
      alerts: totalAlerts
    }
  };
}

async function ensureMinimumDemoData({ minLogs = 120, minAnomalies = 24, minAlerts = 12 } = {}) {
  const [currentLogs, currentAnomalies, currentAlerts] = await Promise.all([
    Log.countDocuments(),
    Anomaly.countDocuments(),
    Alert.countDocuments()
  ]);

  const logsToGenerate = Math.max(0, minLogs - currentLogs);
  const anomaliesToGenerate = Math.max(0, minAnomalies - currentAnomalies);
  const alertsToGenerate = Math.max(0, minAlerts - currentAlerts);

  if (logsToGenerate === 0 && anomaliesToGenerate === 0 && alertsToGenerate === 0) {
    return {
      generated: false,
      logsGenerated: 0,
      anomaliesGenerated: 0,
      alertsGenerated: 0,
      totals: {
        logs: currentLogs,
        anomalies: currentAnomalies,
        alerts: currentAlerts
      }
    };
  }

  const result = await generateDemoData({
    logsCount: logsToGenerate,
    anomaliesCount: anomaliesToGenerate,
    alertsCount: alertsToGenerate
  });

  return {
    generated: true,
    ...result
  };
}

module.exports = {
  generateDemoData,
  ensureMinimumDemoData
};
