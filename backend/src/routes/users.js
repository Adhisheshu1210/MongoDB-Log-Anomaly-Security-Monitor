/**
 * User Management Routes
 * Handles user CRUD operations and role management
 * Only accessible by Admin users
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const rbacService = require('../services/rbacService');
const logger = require('../utils/logger');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -mfaSecret')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Get users error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -mfaSecret').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Get user error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'user', 'viewer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ success: false, message: 'User with this email or username already exists' });

    const user = await User.create({ username, email, password, role });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { _id: user._id, username: user.username, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt }
    });
  } catch (error) {
    logger.error('Create user error:', error.message);
    res.status(500).json({ success: false, message: 'Error creating user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { username, email, isActive } = req.body;
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own account' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) return res.status(400).json({ success: false, message: 'Username already in use' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { _id: user._id, username: user.username, email: user.email, role: user.role, isActive: user.isActive, updatedAt: user.updatedAt }
    });
  } catch (error) {
    logger.error('Update user error:', error.message);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Change user role
// @access  Private (Admin)
router.put('/:id/role', protect, authorize('admin'), [
  body('role').isIn(['admin', 'user', 'viewer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { role } = req.body;
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const oldRole = user.role;
    user.role = role;
    await user.save();

    logger.info(`Role changed: ${user.username} from ${oldRole} to ${role} by ${req.user.username}`);

    res.json({
      success: true,
      message: `User role changed from '${oldRole}' to '${role}'`,
      data: { _id: user._id, username: user.username, email: user.email, role: user.role, isActive: user.isActive }
    });
  } catch (error) {
    logger.error('Change role error:', error.message);
    res.status(500).json({ success: false, message: 'Error changing user role' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const deletedUser = { username: user.username, email: user.email, role: user.role };
    await User.findByIdAndDelete(userId);

    logger.info(`User deleted: ${deletedUser.username} (${deletedUser.role}) by ${req.user.username}`);

    res.json({ success: true, message: 'User deleted successfully', data: deletedUser });
  } catch (error) {
    logger.error('Delete user error:', error.message);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// @route   GET /api/users/meta/roles
// @desc    Get available roles
// @access  Private (Admin)
router.get('/meta/roles', protect, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    data: [
      { value: 'admin', label: 'Administrator', description: 'Full system access - can manage users, settings, and view all data' },
      { value: 'user', label: 'User / Developer', description: 'Can view logs, anomalies, and alerts - can acknowledge but not modify settings' },
      { value: 'viewer', label: 'Viewer', description: 'Read-only access - can only view dashboards and monitoring data' }
    ]
  });
});

module.exports = router;

