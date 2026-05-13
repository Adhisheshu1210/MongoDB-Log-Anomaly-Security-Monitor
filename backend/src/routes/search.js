const express = require('express');
const router = express.Router();

const { protect, checkPermission } = require('../middleware/auth');

// Semantic / vector search endpoints (scaffolding only)

// @route   POST /api/search/query
// @desc    Execute semantic + keyword hybrid search (sandboxed)
// @access  Private
router.post('/query', protect, checkPermission('search:read'), async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Semantic search not implemented yet (scaffold)'
  });
});

module.exports = router;

