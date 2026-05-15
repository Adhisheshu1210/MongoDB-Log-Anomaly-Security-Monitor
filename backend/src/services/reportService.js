/**
 * Report Service
 * Builds, stores, and exports admin reports.
 */

const fs = require('fs');
const path = require('path');
const SiemDatasetRecord = require('../models/SiemDatasetRecord');
const { importDataset, DEFAULT_DATASET } = require('./huggingFaceDatasetService');

const REPORT_TYPE_LABELS = {
  security_incident_summary: 'Security Incident Summary',
  user_activity_audit: 'User Activity Audit',
  infrastructure_health_log: 'Infrastructure Health Log',
  compliance_soc2_gdpr: 'Compliance (SOC2/GDPR)',
  custom: 'Custom Report'
};

const REPORT_TYPE_DEFAULT_RANGE = {
  security_incident_summary: '30d',
  user_activity_audit: '30d',
  infrastructure_health_log: '7d',
  compliance_soc2_gdpr: '30d',
  custom: '30d'
};

const RANGE_PRESETS = {
  '7d': { label: 'Last 7 Days', days: 7 },
  '30d': { label: 'Last 30 Days', days: 30 },
  quarter: { label: 'Last Quarter', days: 90 },
  year: { label: 'Last Year', days: 365 }
};

const INCIDENT_COLORS = {
  security: '#f43f5e',
  performance: '#6366f1',
  capacity: '#f59e0b',
  replication: '#22c55e',
  connection: '#0ea5e9',
  query: '#a855f7',
  resource: '#14b8a6',
  unknown: '#64748b'
};

const LOCAL_DATASET_PATH = path.resolve(__dirname, '../../../advanced_siem_dataset.jsonl');

const normalizeReportType = (reportType = 'security_incident_summary') => String(reportType).trim().toLowerCase();

const resolvePreferredDataset = (dataset) => {
  if (dataset) return String(dataset).trim();
  if (fs.existsSync(LOCAL_DATASET_PATH)) return LOCAL_DATASET_PATH;
  return DEFAULT_DATASET;
};

const ensureDatasetRecords = async (dataset) => {
  const preferredDataset = resolvePreferredDataset(dataset);
  const existingCount = await SiemDatasetRecord.countDocuments({ dataset: preferredDataset });

  if (existingCount > 0) {
    return preferredDataset;
  }

  await importDataset({ dataset: preferredDataset, reset: false });
  return preferredDataset;
};

const buildDateRange = (rangeKey, defaultRangeKey) => {
  const effectiveKey = RANGE_PRESETS[rangeKey] ? rangeKey : defaultRangeKey;
  const preset = RANGE_PRESETS[effectiveKey] || RANGE_PRESETS['30d'];
  const to = new Date();
  const from = new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000);

  return {
    key: effectiveKey,
    label: preset.label,
    from,
    to,
    days: preset.days
  };
};

const buildCsv = (report) => {
  const lines = [
    'Category,Metric,Value',
    `Overview,Total Records,${report.data.overview.totalRecords}`,
    `Overview,Total Anomalies,${report.data.overview.totalAnomalies}`,
    `Overview,Critical Threats,${report.data.overview.criticalThreats}`,
    `Overview,High Threats,${report.data.overview.highThreats}`,
    `Overview,Medium Threats,${report.data.overview.mediumThreats}`,
    `Overview,Low Threats,${report.data.overview.lowThreats}`,
    `Overview,Anomaly Rate,${report.data.overview.anomalyRate}`,
    `Date Range,From,${report.dateRange.from.toISOString()}`,
    `Date Range,To,${report.dateRange.to.toISOString()}`,
    `Compliance,Score,${report.summary.complianceScore}`,
    `Compliance,Status,${report.summary.complianceStatus}`,
    ...report.data.incidentData.map((item) => `Incident,${item.name},${item.value}`)
  ];

  return lines.join('\n');
};

const generateReportPayload = async ({ reportType = 'security_incident_summary', rangeKey, dataset } = {}) => {
  const normalizedReportType = normalizeReportType(reportType);
  const defaultRangeKey = REPORT_TYPE_DEFAULT_RANGE[normalizedReportType] || '30d';
  const dateRange = buildDateRange(rangeKey, defaultRangeKey);
  const datasetSource = await ensureDatasetRecords(dataset);

  const match = {
    dataset: datasetSource,
    timestamp: { $gte: dateRange.from }
  };

  const [totalRecords, totalAnomalies, severityBreakdown, classificationBreakdown, sourceBreakdown, hourlyBreakdown, recentRecords] = await Promise.all([
    SiemDatasetRecord.countDocuments(match),
    SiemDatasetRecord.countDocuments({ ...match, isAnomaly: true }),
    SiemDatasetRecord.aggregate([
      { $match: match },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    SiemDatasetRecord.aggregate([
      { $match: match },
      { $group: { _id: '$classification', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    SiemDatasetRecord.aggregate([
      { $match: match },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    SiemDatasetRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' }
          },
          records: { $sum: 1 },
          anomalies: { $sum: { $cond: ['$isAnomaly', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    SiemDatasetRecord.find(match).sort({ timestamp: -1 }).limit(10).lean()
  ]);

  const severityMap = severityBreakdown.reduce((acc, item) => {
    acc[String(item._id || 'UNKNOWN').toUpperCase()] = item.count;
    return acc;
  }, {});

  const incidentData = classificationBreakdown.map((item) => ({
    name: String(item._id || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: item.count,
    color: INCIDENT_COLORS[String(item._id || 'unknown').toLowerCase()] || INCIDENT_COLORS.unknown
  }));

  const criticalThreats = severityMap.CRITICAL || 0;
  const highThreats = severityMap.HIGH || 0;
  const mediumThreats = severityMap.MEDIUM || 0;
  const lowThreats = severityMap.LOW || 0;
  const anomalyRate = totalRecords > 0 ? Number(((totalAnomalies / totalRecords) * 100).toFixed(2)) : 0;
  const complianceScore = Math.max(0, Math.min(100, Math.round(100 - anomalyRate - (criticalThreats * 4) - (highThreats * 2))));
  const complianceStatus = complianceScore >= 80 ? 'AUDIT PASS' : complianceScore >= 60 ? 'REVIEW' : 'AT RISK';

  const topSources = sourceBreakdown.map((item) => ({
    source: item._id || 'unknown',
    count: item.count
  }));

  const recommendations = [];
  if (criticalThreats > 0) recommendations.push('Isolate critical origins and validate firewall blocks against the imported dataset.');
  if (anomalyRate > 15) recommendations.push('Prioritize investigations for anomaly-heavy classifications and review the top offending sources.');
  if (topSources.length > 0) recommendations.push(`Top source observed: ${topSources[0].source}. Consider rate limiting or containment.`);
  if (recommendations.length === 0) recommendations.push('Dataset indicates low immediate risk; continue scheduled monitoring and periodic export.');

  const topSource = topSources[0]?.source || 'unknown';

  const reportData = {
    reportType: normalizedReportType,
    reportTitle: REPORT_TYPE_LABELS[normalizedReportType] || REPORT_TYPE_LABELS.custom,
    generatedAt: new Date().toISOString(),
    dataset: datasetSource,
    dateRange: {
      key: dateRange.key,
      label: dateRange.label,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString()
    },
    overview: {
      totalRecords,
      totalAnomalies,
      criticalThreats,
      highThreats,
      mediumThreats,
      lowThreats,
      anomalyRate,
      complianceScore,
      complianceStatus,
      topSource
    },
    incidentData: incidentData.length > 0 ? incidentData : [{ name: 'Unknown', value: 1, color: INCIDENT_COLORS.unknown }],
    severityBreakdown: severityBreakdown.map((item) => ({
      severity: String(item._id || 'UNKNOWN').toUpperCase(),
      count: item.count
    })),
    classificationBreakdown,
    sourceBreakdown: topSources,
    hourlyBreakdown: hourlyBreakdown.map((item) => ({
      name: item._id,
      records: item.records,
      anomalies: item.anomalies
    })),
    recentRecords: recentRecords.map((record) => ({
      timestamp: record.timestamp,
      severity: record.severity,
      source: record.source,
      classification: record.classification,
      isAnomaly: record.isAnomaly,
      anomalyScore: record.anomalyScore,
      record: record.rawRecord
    })),
    recommendations,
    health: {
      totalSources: topSources.length,
      anomalyDensity: totalRecords > 0 ? Number((totalAnomalies / totalRecords).toFixed(4)) : 0,
      complianceStatus
    },
    datasetSummary: {
      source: datasetSource,
      recordsAnalyzed: totalRecords,
      anomaliesDetected: totalAnomalies
    },
    logs: {
      bySeverity: severityBreakdown,
      byComponent: topSources,
      recent: recentRecords.map((record) => ({
        timestamp: record.timestamp,
        severity: record.severity,
        component: record.source,
        message: record.rawRecord?.message || record.rawRecord?.description || JSON.stringify(record.rawRecord).substring(0, 200),
        classification: record.classification,
        isAnomaly: record.isAnomaly
      }))
    },
    anomalies: {
      byType: classificationBreakdown,
      bySeverity: severityBreakdown,
      recent: recentRecords.filter((record) => record.isAnomaly).slice(0, 10).map((record) => ({
        timestamp: record.timestamp,
        severity: record.severity,
        type: record.classification,
        title: String(record.rawRecord?.label || record.rawRecord?.classification || 'Dataset anomaly detected'),
        anomalyScore: record.anomalyScore,
        isResolved: false
      }))
    },
    alerts: {
      byCategory: classificationBreakdown,
      bySeverity: severityBreakdown,
      status: {
        new: totalAnomalies,
        investigating: Math.ceil(totalAnomalies / 2),
        resolved: 0
      },
      recent: recentRecords.filter((record) => record.isAnomaly).slice(0, 10).map((record) => ({
        timestamp: record.timestamp,
        severity: String(record.severity || 'LOW').toLowerCase(),
        category: record.classification,
        title: String(record.rawRecord?.label || record.rawRecord?.classification || 'Dataset alert'),
        status: 'new'
      }))
    },
    users: {
      total: 0,
      byRole: {}
    }
  };

  const summary = {
    totalLogs: totalRecords,
    totalAnomalies,
    totalAlerts: totalAnomalies,
    complianceScore,
    complianceStatus,
    incidentCount: incidentData.reduce((sum, item) => sum + item.value, 0),
    userCount: 0,
    generatedAt: reportData.generatedAt
  };

  const csvContent = buildCsv({
    data: reportData,
    summary,
    dateRange: {
      from: dateRange.from,
      to: dateRange.to
    }
  });

  return {
    reportData,
    summary,
    csvContent,
    dateRange: {
      key: dateRange.key,
      label: dateRange.label,
      from: dateRange.from,
      to: dateRange.to
    },
    reportType: normalizedReportType,
    reportTitle: REPORT_TYPE_LABELS[normalizedReportType] || REPORT_TYPE_LABELS.custom
  };
};

module.exports = {
  generateReportPayload,
  REPORT_TYPE_LABELS,
  RANGE_PRESETS
};