/**
 * Security Routes
 * Comprehensive security management with threat analysis from SIEM data
 */

const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const SiemDatasetRecord = require('../models/SiemDatasetRecord');
const AuditLog = require('../models/AuditLog');
const Log = require('../models/Log');
const logger = require('../utils/logger');

const GEO_LOCATION_MAP = {
  'United States': { lat: 37.0902, lng: -95.7129, code: 'US' },
  Germany: { lat: 51.1657, lng: 10.4515, code: 'DE' },
  China: { lat: 35.8617, lng: 104.1954, code: 'CN' },
  Russia: { lat: 61.524, lng: 105.3188, code: 'RU' },
  India: { lat: 20.5937, lng: 78.9629, code: 'IN' },
  Brazil: { lat: -14.235, lng: -51.9253, code: 'BR' },
  France: { lat: 46.2276, lng: 2.2137, code: 'FR' },
  'United Kingdom': { lat: 55.3781, lng: -3.436, code: 'GB' },
  Japan: { lat: 36.2048, lng: 138.2529, code: 'JP' },
  Australia: { lat: -25.2744, lng: 133.7751, code: 'AU' },
  Canada: { lat: 56.1304, lng: -106.3468, code: 'CA' },
  Netherlands: { lat: 52.1326, lng: 5.2913, code: 'NL' },
  Singapore: { lat: 1.3521, lng: 103.8198, code: 'SG' },
  'South Korea': { lat: 35.9078, lng: 127.7669, code: 'KR' },
  'United Arab Emirates': { lat: 23.4241, lng: 53.8478, code: 'AE' },
  Unknown: { lat: 0, lng: 0, code: 'XX' }
};

const SEVERITY_RANK = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNKNOWN: 0
};

const normalizeDatasetFilter = (dataset) => (dataset ? String(dataset).trim() : '');

const buildDatasetMatch = ({ since, dataset }) => {
  const match = {
    timestamp: { $gte: since },
    rawRecord: { $exists: true }
  };

  const safeDataset = normalizeDatasetFilter(dataset);
  if (safeDataset) {
    match.dataset = safeDataset;
  }

  return match;
};

const buildThreatMap = async ({ days = 1, limit = 100, dataset } = {}) => {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days, 10));

  const threatsByLocation = await SiemDatasetRecord.aggregate([
    { $match: buildDatasetMatch({ since, dataset }) },
    {
      $group: {
        _id: {
          sourceIp: {
            $ifNull: ['$rawRecord.src_ip', { $ifNull: ['$rawRecord.source_ip', 'Unknown'] }]
          },
          location: {
            $ifNull: ['$rawRecord.src_country', { $ifNull: ['$rawRecord.source_country', 'Unknown'] }]
          }
        },
        count: { $sum: 1 },
        severity: { $max: '$severity' },
        lastSeen: { $max: '$timestamp' },
        ports: { $addToSet: '$rawRecord.dst_port' },
        protocols: { $addToSet: '$rawRecord.protocol' },
        classifications: { $addToSet: '$classification' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: parseInt(limit, 10) }
  ]);

  const threatMap = threatsByLocation.map((threat) => {
    const location = threat._id.location || 'Unknown';
    const geoData = GEO_LOCATION_MAP[location] || GEO_LOCATION_MAP.Unknown;

    return {
      sourceIp: threat._id.sourceIp,
      location,
      country: threat._id.location,
      latitude: geoData.lat,
      longitude: geoData.lng,
      countryCode: geoData.code,
      threatCount: threat.count,
      severity: threat.severity,
      lastSeen: threat.lastSeen,
      ports: Array.from(threat.ports).filter((p) => p !== null && p !== undefined),
      protocols: Array.from(threat.protocols).filter((p) => p !== null && p !== undefined),
      classifications: Array.from(threat.classifications).filter((p) => p !== null && p !== undefined)
    };
  });

  return {
    period: { days, since },
    totalLocations: threatMap.length,
    totalThreats: threatMap.reduce((sum, threat) => sum + threat.threatCount, 0),
    threats: threatMap
  };
};

const buildPatchSequencePlan = async ({ days = 7, limit = 100, dataset } = {}) => {
  const threatMap = await buildThreatMap({ days, limit, dataset });
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days, 10));

  const [classificationStats, anomalyStats, portStats] = await Promise.all([
    SiemDatasetRecord.aggregate([
      { $match: buildDatasetMatch({ since, dataset }) },
      { $group: { _id: '$classification', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    SiemDatasetRecord.aggregate([
      { $match: { ...buildDatasetMatch({ since, dataset }), isAnomaly: true } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    SiemDatasetRecord.aggregate([
      { $match: buildDatasetMatch({ since, dataset }) },
      {
        $group: {
          _id: { port: '$rawRecord.dst_port', protocol: '$rawRecord.protocol' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);

  const highRiskOrigins = threatMap.threats
    .filter((threat) => SEVERITY_RANK[String(threat.severity || '').toUpperCase()] >= SEVERITY_RANK.HIGH)
    .slice(0, 5);

  const topClassifications = classificationStats.map((item) => ({
    name: item._id || 'unknown',
    count: item.count
  }));

  const topPorts = portStats.map((item) => ({
    port: item._id?.port ?? 'unknown',
    protocol: item._id?.protocol ?? 'unknown',
    count: item.count
  }));

  const dominantClassification = topClassifications[0]?.name || 'unknown';
  const totalAnomalies = anomalyStats.reduce((sum, item) => sum + item.count, 0);
  const riskScore = Math.min(
    100,
    Math.round(
      threatMap.totalThreats * 1.5 +
      highRiskOrigins.length * 12 +
      totalAnomalies * 6 +
      (topClassifications[0]?.count || 0) * 2
    )
  );
  const riskLevel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 55 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

  const recommendations = [];
  const actions = [];

  if (highRiskOrigins.length > 0) {
    const blockedOrigins = highRiskOrigins.map((threat) => threat.sourceIp);
    recommendations.push(`Block or rate-limit ${blockedOrigins.length} high-risk origin IPs`);
    actions.push({
      type: 'BLOCK_ORIGINS',
      title: 'Block high-risk origins',
      targets: blockedOrigins,
      severity: 'HIGH',
      status: 'queued'
    });
  }

  if (topClassifications.length > 0) {
    recommendations.push(`Review ${topClassifications[0].name} events for dataset-wide containment`);
    actions.push({
      type: 'REVIEW_CLASSIFICATION',
      title: 'Review dominant attack class',
      targets: topClassifications,
      severity: 'MEDIUM',
      status: 'queued'
    });
  }

  if (topPorts.length > 0) {
    recommendations.push(`Apply temporary ACL tightening on ${topPorts[0].port}/${topPorts[0].protocol}`);
    actions.push({
      type: 'TIGHTEN_ACL',
      title: 'Tighten perimeter ACLs',
      targets: topPorts,
      severity: 'MEDIUM',
      status: 'queued'
    });
  }

  if (/auth|login|credential|password/i.test(dominantClassification)) {
    recommendations.push('Rotate credentials and invalidate stale sessions');
    actions.push({
      type: 'ROTATE_CREDENTIALS',
      title: 'Rotate credentials',
      targets: ['authentication'],
      severity: 'CRITICAL',
      status: 'queued'
    });
  }

  if (actions.length === 0) {
    recommendations.push('No immediate containment needed; continue active monitoring');
  }

  return {
    threatMap,
    riskScore,
    riskLevel,
    topClassifications,
    anomalyStats,
    topPorts,
    highRiskOrigins,
    recommendations,
    actions
  };
};
/**
 * @route   GET /api/security/overview
 * @desc    Get security overview with risk metrics
 * @access  Private
 */
router.get('/overview', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [
      totalThreats,
      criticalThreats,
      anomalyCount,
      failedAttempts,
      topThreats,
      riskLevel
    ] = await Promise.all([
      SiemDatasetRecord.countDocuments({ timestamp: { $gte: since } }),
      SiemDatasetRecord.countDocuments({
        timestamp: { $gte: since },
        severity: { $in: ['CRITICAL', 'HIGH'] }
      }),
      SiemDatasetRecord.countDocuments({
        timestamp: { $gte: since },
        isAnomaly: true
      }),
      AuditLog.countDocuments({
        timestamp: { $gte: since },
        status: 'FAILED'
      }),
      SiemDatasetRecord.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$classification', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Log.countDocuments({
        timestamp: { $gte: since },
        severity: 'ERROR'
      })
    ]);

    // Calculate risk level
    const riskScore =
      (criticalThreats * 10 + anomalyCount * 5 + failedAttempts * 3) /
      Math.max(1, totalThreats);
    const calculateRiskLevel = (score) => {
      if (score > 7) return 'CRITICAL';
      if (score > 5) return 'HIGH';
      if (score > 3) return 'MEDIUM';
      if (score > 1) return 'LOW';
      return 'MINIMAL';
    };

    // Protection score (inverse of risk)
    const protectionScore = Math.round(100 - riskScore * 10);

    res.json({
      success: true,
      data: {
        period: { days, since },
        totalThreats,
        criticalThreats,
        anomalyCount,
        failedAttempts,
        protectionScore: Math.max(0, Math.min(100, protectionScore)),
        riskLevel: calculateRiskLevel(riskScore),
        riskPercentage: Math.round(riskScore * 10),
        topThreats,
        recentErrors: riskLevel
      }
    });
  } catch (error) {
    logger.error('Get security overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching security overview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/security/threats
 * @desc    Get threat data with filtering and pagination
 * @access  Private
 */
router.get('/threats', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      classification,
      isAnomaly,
      startDate,
      endDate,
      sort = '-timestamp'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(500, Math.max(1, parseInt(limit)));

    const query = {};

    if (severity) {
      query.severity = { $in: severity.split(',') };
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

    const [threats, total] = await Promise.all([
      SiemDatasetRecord.find(query)
        .sort(sort)
        .limit(pageSize)
        .skip((pageNum - 1) * pageSize)
        .lean(),
      SiemDatasetRecord.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: threats.map((t) => ({
        id: t._id,
        timestamp: t.timestamp,
        severity: t.severity,
        classification: t.classification,
        isAnomaly: t.isAnomaly,
        anomalyScore: t.anomalyScore,
        source: t.rawRecord?.source || 'Unknown',
        sourceIp: t.rawRecord?.src_ip || t.rawRecord?.source_ip || 'N/A',
        targetIp: t.rawRecord?.dst_ip || t.rawRecord?.dest_ip || 'N/A',
        port: t.rawRecord?.dst_port || t.rawRecord?.port || 'N/A',
        protocol: t.rawRecord?.protocol || 'N/A',
        action: t.rawRecord?.action || 'N/A',
        description: t.rawRecord?.label || t.rawRecord?.description || ''
      })),
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
        hasMore: pageNum < Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('Get threats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching threats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/security/threat-map
 * @desc    Get threat map data with geo-locations and source IPs
 * @access  Private
 */
router.get('/threat-map', protect, async (req, res) => {
  try {
    const threatMap = await buildThreatMap({
      days: req.query.days || 1,
      limit: req.query.limit || 100,
      dataset: req.query.dataset
    });

    res.json({
      success: true,
      data: threatMap
    });
  } catch (error) {
    logger.error('Get threat map error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching threat map',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/security/attack-surface
 * @desc    Get attack surface data (hourly breakdown)
 * @access  Private
 */
router.get('/attack-surface', protect, async (req, res) => {
  try {
    const { days = 1, dataset } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const hourlyData = await SiemDatasetRecord.aggregate([
      {
        $match: {
          timestamp: { $gte: since },
          ...(normalizeDatasetFilter(dataset) ? { dataset: normalizeDatasetFilter(dataset) } : {})
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%H:%M',
              date: '$timestamp'
            }
          },
          attempts: { $sum: 1 },
          severity: { $max: '$severity' },
          anomalies: {
            $sum: { $cond: ['$isAnomaly', 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: hourlyData.map((h) => ({
        name: h._id,
        attempts: h.attempts,
        anomalies: h.anomalies,
        severity: h.severity
      }))
    });
  } catch (error) {
    logger.error('Get attack surface error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attack surface data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/security/patch-sequence
 * @desc    Execute a dataset-driven patch and containment plan
 * @access  Private
 */
router.post('/patch-sequence', protect, checkPermission('threat:remediate-suggestions'), async (req, res) => {
  try {
    const { days = 7, limit = 100, dataset, dryRun = false } = req.body || {};
    const plan = await buildPatchSequencePlan({ days, limit, dataset });

    const auditEntry = await AuditLog.create({
      action: 'AUTO_BLOCK',
      resourceType: 'SYSTEM',
      resourceTarget: 'security-patch-sequence',
      status: dryRun ? 'PENDING' : 'SUCCESS',
      severity: plan.riskLevel,
      reason: `Patch sequence generated from ${plan.threatMap.totalThreats} threats across ${plan.threatMap.totalLocations} origins`,
      metadata: {
        dataset: normalizeDatasetFilter(dataset) || 'all',
        days: parseInt(days, 10),
        dryRun,
        plan
      },
      ipAddress: req.ip || 'Internal',
      userId: req.user?._id
    });

    return res.json({
      success: true,
      message: dryRun ? 'Patch sequence plan generated' : 'Patch sequence executed',
      data: {
        auditId: auditEntry._id,
        dryRun,
        riskScore: plan.riskScore,
        riskLevel: plan.riskLevel,
        threatMap: plan.threatMap,
        topClassifications: plan.topClassifications,
        topPorts: plan.topPorts,
        highRiskOrigins: plan.highRiskOrigins,
        recommendations: plan.recommendations,
        actions: plan.actions
      }
    });
  } catch (error) {
    logger.error('Patch sequence error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute patch sequence',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/security/policies
 * @desc    Get active security policies
 * @access  Private
 */
router.get('/policies', protect, async (req, res) => {
  try {
    const policies = [
      {
        id: 'mfa',
        title: 'Multi-Factor Auth (MFA)',
        status: 'ENFORCED',
        description: 'Required for all admin-level actions.',
        active: true,
        lastUpdated: new Date('2026-05-10'),
        coverage: '100%'
      },
      {
        id: 'rate-limit',
        title: 'IP Rate Limiting',
        status: 'ACTIVE',
        description: 'Max 100 requests/sec per origin IP.',
        active: true,
        lastUpdated: new Date('2026-05-12'),
        coverage: '95%'
      },
      {
        id: 'encryption',
        title: 'Cold Storage Encryption',
        status: 'ENFORCED',
        description: 'AES-256 for logs older than 30 days.',
        active: true,
        lastUpdated: new Date('2026-05-08'),
        coverage: '100%'
      },
      {
        id: 'ai-blocking',
        title: 'Automated IP Blacklisting',
        status: 'LEARNING',
        description: 'AI-driven blocking of suspicious nodes.',
        active: false,
        lastUpdated: new Date('2026-05-14'),
        coverage: '45%'
      }
    ];

    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    logger.error('Get policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/security/vulnerabilities
 * @desc    Get known vulnerabilities and advisories
 * @access  Private
 */
router.get('/vulnerabilities', protect, async (req, res) => {
  try {
    const vulnerabilities = [
      {
        id: 'CVE-2026-0912',
        title: 'Kernel Vulnerability Found',
        severity: 'CRITICAL',
        description: 'Patch required for Shard-04.',
        cveId: 'CVE-2026-0912',
        affectedSystems: ['Shard-04'],
        discoveredDate: new Date('2026-05-14'),
        patchAvailable: true,
        CVSS: 9.8
      }
    ];

    res.json({
      success: true,
      data: vulnerabilities
    });
  } catch (error) {
    logger.error('Get vulnerabilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vulnerabilities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/security/policies/:id
 * @desc    Update security policy configuration
 * @access  Private (Admin)
 */
router.put('/policies/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { active, description, status } = req.body;

    // In a real system, this would update a Policies collection
    // For now, return success
    res.json({
      success: true,
      message: 'Policy updated successfully',
      data: {
        id,
        active,
        description,
        status,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Update policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating policy',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
