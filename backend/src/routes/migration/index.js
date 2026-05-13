const express = require('express');
const router = express.Router();

const { protect, checkPermission } = require('../../middleware/auth');

// @route   POST /api/migration/create
// @desc    Create a migration job plan
// @access  Private
router.post('/create', protect, checkPermission('migration:create'), async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Migration create not implemented yet (scaffold)'
  });
});

// @route   POST /api/migration/:jobId/start
// @desc    Start migration workers
// @access  Private
router.post('/:jobId/start', protect, checkPermission('migration:start'), async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Migration start not implemented yet (scaffold)'
  });
});

// @route   POST /api/migration/:jobId/rollback
// @desc    Rollback migration to last checkpoint
// @access  Private
router.post('/:jobId/rollback', protect, checkPermission('migration:rollback'), async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Migration rollback not implemented yet (scaffold)'
  });
});

// @route   GET /api/migration/:jobId/status
// @desc    Get migration status + validation summary
// @access  Private
router.get('/:jobId/status', protect, checkPermission('migration:read'), async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Migration status not implemented yet (scaffold)'
  });
});

module.exports = router;

