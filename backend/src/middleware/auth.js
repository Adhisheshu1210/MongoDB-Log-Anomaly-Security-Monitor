/**
 * Authentication Middleware
 * JWT token verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rbacService = require('../services/rbacService');
const logger = require('../utils/logger');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is disabled'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized: ${req.user.username} (${req.user.role}) → ${req.method} ${req.path}`);
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Permission-based authorization using RBAC service
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!rbacService.isActionAllowed(req.user, permission)) {
      logger.warn(`Permission denied: ${req.user.username} → ${permission}`);
      return res.status(403).json({
        success: false,
        message: rbacService.getUnauthorizedMessage(permission, req.user.role),
        requiredPermission: permission,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Check multiple permissions (OR - user needs at least one)
const checkAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const hasPermission = permissions.some(perm => 
      rbacService.isActionAllowed(req.user, perm)
    );

    if (!hasPermission) {
      logger.warn(`No permission: ${req.user.username} needs one of: ${permissions.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `User requires at least one of these permissions: ${permissions.join(', ')}`,
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Check multiple permissions (AND - user needs all)
const checkAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const hasAllPermissions = permissions.every(perm => 
      rbacService.isActionAllowed(req.user, perm)
    );

    if (!hasAllPermissions) {
      logger.warn(`Missing permissions: ${req.user.username} needs all of: ${permissions.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `User requires all of these permissions: ${permissions.join(', ')}`,
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Convenience middleware for admin-only routes
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Admin action attempted by: ${req.user.username} (${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'This action requires administrator privileges',
      userRole: req.user.role
    });
  }
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = { 
  protect, 
  authorize, 
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  isAdmin,
  generateToken 
};

