/**
 * SIEM dataset routes.
 * Imports and serves Hugging Face dataset rows with role-based views.
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { protect, checkPermission, authorize } = require('../middleware/auth');
const SiemDatasetRecord = require('../models/SiemDatasetRecord');
const { importDataset, DEFAULT_DATASET } = require('../services/huggingFaceDatasetService');
const { sanitizeByRole } = require('../services/roleDataSanitizer');
const { syncDatasetToCore } = require('../services/siemDatasetSyncService');

logger.info('SIEM dataset routes module loaded');

// @route   POST /api/siem-dataset/import
// @desc    Import all rows from Hugging Face SIEM dataset into MongoDB
// @access  Private (Admin only)
router.post('/import', protect, authorize('admin'), async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can import dataset data'
      });
    }

    const dataset = req.body.dataset || DEFAULT_DATASET;
    const reset = req.body.reset === true;

    const summary = await importDataset({ dataset, reset });

    return res.json({
      success: true,
      message: 'Dataset import completed',
      data: summary
    });
  } catch (error) {
    logger.error(`Dataset import error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to import Hugging Face dataset',
      error: error.message
    });
  }
});

// @route   POST /api/siem-dataset/sync
// @desc    Sync imported SIEM records into existing Log and Anomaly collections
// @access  Private (Admin only)
router.post('/sync', protect, checkPermission('siem-dataset:sync'), async (req, res) => {
  try {
    const result = await syncDatasetToCore({
      dataset: req.body.dataset,
      split: req.body.split,
      config: req.body.config,
      limit: req.body.limit,
      reset: req.body.reset === true
    });

    return res.json({
      success: true,
      message: 'Dataset records synced to core collections',
      data: result
    });
  } catch (error) {
    logger.error(`Dataset sync error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync dataset records',
      error: error.message
    });
  }
});

// @route   GET /api/siem-dataset
// @desc    Get imported SIEM dataset rows with role-based data shaping
// @access  Private
router.get('/', protect, checkPermission('siem-dataset:read'), async (req, res) => {
  try {
    const {
      dataset = DEFAULT_DATASET,
      split,
      config,
      severity,
      classification,
      isAnomaly,
      startDate,
      endDate,
      page = 1,
      limit = 100,
      sort = '-timestamp'
    } = req.query;

    const safeLimit = Math.min(parseInt(limit, 10) || 100, 500);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);

    const query = { dataset };

    if (split) query.split = split;
    if (config) query.config = config;
    if (severity) query.severity = { $in: severity.split(',').map((item) => item.trim().toUpperCase()) };
    if (classification) query.classification = { $in: classification.split(',').map((item) => item.trim()) };
    if (isAnomaly !== undefined) query.isAnomaly = isAnomaly === 'true';

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const docs = await SiemDatasetRecord.find(query)
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const total = await SiemDatasetRecord.countDocuments(query);

    const data = docs.map((doc) => ({
      id: doc._id,
      dataset: doc.dataset,
      config: doc.config,
      split: doc.split,
      rowIdx: doc.rowIdx,
      timestamp: doc.timestamp,
      severity: doc.severity,
      source: doc.source,
      classification: doc.classification,
      isAnomaly: doc.isAnomaly,
      anomalyScore: doc.anomalyScore,
      record: sanitizeByRole(doc.rawRecord, req.user.role)
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    logger.error(`Dataset fetch error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SIEM dataset records',
      error: error.message
    });
  }
});

// @route   GET /api/siem-dataset/stats
// @desc    Dataset ingestion stats
// @access  Private
router.get('/stats', protect, checkPermission('siem-dataset:read'), async (req, res) => {
  try {
    const dataset = req.query.dataset || DEFAULT_DATASET;

    const [total, splitStats, severityStats] = await Promise.all([
      SiemDatasetRecord.countDocuments({ dataset }),
      SiemDatasetRecord.aggregate([
        { $match: { dataset } },
        { $group: { _id: { config: '$config', split: '$split' }, count: { $sum: 1 } } },
        { $sort: { '_id.config': 1, '_id.split': 1 } }
      ]),
      SiemDatasetRecord.aggregate([
        { $match: { dataset } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return res.json({
      success: true,
      data: {
        dataset,
        total,
        bySplit: splitStats,
        bySeverity: severityStats
      }
    });
  } catch (error) {
    logger.error(`Dataset stats error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dataset stats',
      error: error.message
    });
  }
});

module.exports = router;
