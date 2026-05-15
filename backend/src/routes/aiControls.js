/**
 * AI Controls Routes
 * Exposes model configuration, retraining, metrics, and activity.
 */

const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const aiControlService = require('../services/aiControlService');
const logger = require('../utils/logger');

logger.info('AI controls routes module loaded');

// @route   GET /api/ai-controls
// @desc    Get AI dashboard state, metrics, and recent activity
// @access  Private (Admin)
router.get('/', protect, checkPermission('manage_ai_settings'), async (req, res) => {
  try {
    const data = await aiControlService.getDashboard();
    return res.json({ success: true, data });
  } catch (error) {
    logger.error(`AI dashboard fetch error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to load AI controls', error: error.message });
  }
});

// @route   PUT /api/ai-controls/settings
// @desc    Update AI controls configuration
// @access  Private (Admin)
router.put('/settings', protect, checkPermission('manage_ai_settings'), async (req, res) => {
  try {
    const data = await aiControlService.updateSettings(req.user, req.body || {});
    return res.json({ success: true, message: 'AI settings updated', data });
  } catch (error) {
    logger.error(`AI settings update error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update AI settings', error: error.message });
  }
});

// @route   POST /api/ai-controls/retrain
// @desc    Trigger model retraining and refresh metrics
// @access  Private (Admin)
router.post('/retrain', protect, checkPermission('manage_ai_settings'), async (req, res) => {
  try {
    const data = await aiControlService.retrainModel(req.user, req.body || {});
    return res.json({ success: true, message: 'AI retraining completed', data });
  } catch (error) {
    logger.error(`AI retraining error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to retrain AI model', error: error.message });
  }
});

// @route   GET /api/ai-controls/metrics
// @desc    Get model metrics in radar-chart format
// @access  Private (Admin)
router.get('/metrics', protect, checkPermission('manage_ai_settings'), async (req, res) => {
  try {
    const data = await aiControlService.getDashboard();
    return res.json({ success: true, data: { metrics: data.metrics, state: data.state } });
  } catch (error) {
    logger.error(`AI metrics fetch error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to load AI metrics', error: error.message });
  }
});

// @route   GET /api/ai-controls/activity
// @desc    Get recent AI inference/retraining activity
// @access  Private (Admin)
router.get('/activity', protect, checkPermission('manage_ai_settings'), async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const data = await aiControlService.getActivity(limit);
    return res.json({ success: true, data });
  } catch (error) {
    logger.error(`AI activity fetch error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to load AI activity', error: error.message });
  }
});

module.exports = router;