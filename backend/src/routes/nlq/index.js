const express = require('express');
const router = express.Router();

const { protect, checkPermission } = require('../../middleware/auth');

// @route   POST /api/nlq/translate
// @desc    Translate natural language into MongoDB query spec (explain)
// @access  Private
router.post('/translate', protect, checkPermission('nlq:translate'), async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'NLQ translate not implemented yet (scaffold)'
  });
});

// @route   POST /api/nlq/execute
// @desc    Execute sandboxed query (read-only)
// @access  Private
router.post('/execute', protect, checkPermission('nlq:execute'), async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'NLQ execute not implemented yet (scaffold)'
  });
});

module.exports = router;

