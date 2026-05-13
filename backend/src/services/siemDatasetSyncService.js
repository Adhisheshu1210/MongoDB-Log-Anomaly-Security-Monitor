/**
 * Sync imported SIEM dataset rows into existing Log and Anomaly collections.
 */

const SiemDatasetRecord = require('../models/SiemDatasetRecord');
const Log = require('../models/Log');
const Anomaly = require('../models/Anomaly');

const LOG_SEVERITY_SET = new Set(['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE']);
const ANOMALY_SEVERITY_SET = new Set(['critical', 'high', 'medium', 'low', 'info']);
const ANOMALY_TYPE_SET = new Set(['security', 'performance', 'capacity', 'replication', 'connection', 'query', 'resource', 'unknown']);

const toLogSeverity = (value) => {
  const normalized = String(value || 'INFO').toUpperCase();
  if (normalized === 'WARN') return 'WARNING';
  return LOG_SEVERITY_SET.has(normalized) ? normalized : 'INFO';
};

const toAnomalySeverity = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'fatal' || normalized === 'error') return 'high';
  if (normalized === 'warning' || normalized === 'warn') return 'medium';
  if (normalized === 'debug' || normalized === 'trace') return 'low';
  if (ANOMALY_SEVERITY_SET.has(normalized)) return normalized;
  return 'medium';
};

const toAnomalyType = (value) => {
  const normalized = String(value || '').toLowerCase();
  return ANOMALY_TYPE_SET.has(normalized) ? normalized : 'unknown';
};

const parseDate = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const syncDatasetToCore = async ({
  dataset,
  split,
  config,
  limit = 5000,
  reset = false
}) => {
  const query = {};
  if (dataset) query.dataset = dataset;
  if (split) query.split = split;
  if (config) query.config = config;

  if (reset) {
    await Promise.all([
      Log.deleteMany({ source: 'huggingface_dataset' }),
      Anomaly.deleteMany({ source: 'huggingface_dataset' })
    ]);
  }

  const records = await SiemDatasetRecord.find(query)
    .sort({ timestamp: -1 })
    .limit(Math.min(limit, 20000))
    .lean();

  let logsUpserted = 0;
  let anomaliesUpserted = 0;

  for (const record of records) {
    const row = record.rawRecord || {};

    const ts = parseDate(record.timestamp || row.timestamp || row.time || row.event_time);
    const component = String(row.component || row.service || row.source || record.source || 'dataset_ingest');
    const message = String(row.message || row.event || row.description || JSON.stringify(row));

    const logDoc = {
      timestamp: ts,
      severity: toLogSeverity(record.severity || row.severity || row.level),
      component,
      message,
      context: {
        attr: {
          dataset: record.dataset,
          config: record.config,
          split: record.split,
          rowIdx: record.rowIdx
        },
        command: row
      },
      raw: JSON.stringify(row),
      classification: String(record.classification || row.classification || row.label || 'unknown'),
      isAnomaly: Boolean(record.isAnomaly),
      anomalyScore: Number(record.anomalyScore || 0),
      source: 'huggingface_dataset',
      processedAt: new Date()
    };

    const logWrite = await Log.updateOne(
      {
        source: 'huggingface_dataset',
        'context.attr.dataset': record.dataset,
        'context.attr.config': record.config,
        'context.attr.split': record.split,
        'context.attr.rowIdx': record.rowIdx
      },
      { $set: logDoc },
      { upsert: true }
    );

    if (logWrite.upsertedCount > 0 || logWrite.modifiedCount > 0) {
      logsUpserted += 1;
    }

    if (record.isAnomaly) {
      const anomalyDoc = {
        timestamp: ts,
        severity: toAnomalySeverity(logDoc.severity),
        type: toAnomalyType(row.type || row.anomaly_type || row.category),
        title: String(row.title || 'Dataset anomaly detected'),
        description: String(row.description || message),
        details: {
          logMessage: message,
          component,
          actualValue: Number(record.anomalyScore || 0),
          threshold: 0.5,
          affectedUsers: row.user ? [String(row.user)] : []
        },
        anomalyScore: Math.max(0, Math.min(1, Number(record.anomalyScore || 0))),
        algorithm: 'rule_based',
        confidence: 0.7,
        recommendedAction: 'Review source event details and investigate root cause.',
        isResolved: false,
        source: 'huggingface_dataset'
      };

      const anomalyWrite = await Anomaly.updateOne(
        {
          source: 'huggingface_dataset',
          timestamp: ts,
          'details.component': component,
          'details.logMessage': message
        },
        { $set: anomalyDoc },
        { upsert: true }
      );

      if (anomalyWrite.upsertedCount > 0 || anomalyWrite.modifiedCount > 0) {
        anomaliesUpserted += 1;
      }
    }
  }

  return {
    matchedRecords: records.length,
    logsUpserted,
    anomaliesUpserted
  };
};

module.exports = {
  syncDatasetToCore
};
