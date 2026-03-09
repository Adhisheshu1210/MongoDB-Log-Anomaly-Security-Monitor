/**
 * Enhanced Authentication Middleware
 * JWT token verification and comprehensive role-based access control
 * Includes permission checking, audit logging, and detailed error messages
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rbacService = require('../services/rbacService');
const securityService = require('../services/securityService');
const logger = require('../utils/logger');

/**
 * Core Authentication Middleware
 * Verifies JWT token and attaches authenticated user to request object
 * 
 * @middleware
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @example
 * router.get('/protected', protect, handler)
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Fallback: check for token in cookies (if enabled)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // No token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      details: 'No authentication token provided. Include token in Authorization header: Bearer <token>',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify JWT token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      logger.warn(`Token validation: User not found (${decoded.id})`);
      return res.status(401).json({
        success: false,
        message: 'User not found',
        details: 'The user associated with this token no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      logger.warn(`Authentication blocked: Inactive user (${user.username})`);
      return res.status(401).json({
        success: false,
        message: 'User account is disabled',
        details: 'Contact administrator to reactivate your account',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Update last activity timestamp
    user.lastLogin = new Date();
    await user.save();

    // Attach user to request object
    req.user = user;
    
    logger.debug(`✓ Authenticated: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    // Handle different JWT errors with descriptive messages
    if (error.name === 'TokenExpiredError') {
      logger.warn(`Token expired: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        details: 'Please login again to get a new token',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid token: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        details: 'The provided token is malformed or cannot be verified',
        code: 'INVALID_TOKEN'
      });
    }

    logger.error(`Authentication error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      details: 'An error occurred while validating your credentials',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Restricts access to specific user roles
 * 
 * @middleware
 * @param {...string} roles - Allowed roles (admin, user, viewer)
 * @returns {Function} Middleware function
 * @example
 * router.post('/admin', protect, authorize('admin'), handler)
 * router.put('/config', protect, authorize('admin'), handler)
 * router.get('/dashboard', protect, authorize('admin', 'user'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Verify user is authenticated (protect should run first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        details: 'Authentication middleware was not executed',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Check if user role is in allowed roles list
    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization failed: ${req.user.username} (${req.user.role}) attempted access to ${req.method} ${req.path}`);
      
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
        details: `Only users with the following roles are allowed: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    logger.debug(`✓ Authorization granted: ${req.user.username} (${req.user.role}) → ${req.path}`);
    next();
  };
};

/**
 * Permission-Based Authorization Middleware
 * Checks specific action permissions using RBAC service
 * 
 * @middleware
 * @param {string} permission - Permission to verify (e.g., 'settings:backup')
 * @returns {Function} Middleware function
 * @example
 * router.get('/backup', protect, checkPermission('settings:backup'), handler)
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    // Verify user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Check if user has required permission
    if (!rbacService.isActionAllowed(req.user, permission)) {
      logger.warn(`Permission denied: ${req.user.username} → ${permission}`);
      
      return res.status(403).json({
        success: false,
        message: rbacService.getUnauthorizedMessage(permission, req.user.role),
        code: 'INSUFFICIENT_PERMISSION',
        requiredPermission: permission,
        userRole: req.user.role
      });
    }

    logger.debug(`✓ Permission granted: ${req.user.username} → ${permission}`);
    next();
  };
};

/**
 * Multiple Permissions (OR) - User needs at least ONE permission
 * Useful when multiple actions can satisfy the requirement
 * 
 * @middleware
 * @param {...string} permissions - Permissions (user needs at least one)
 * @returns {Function} Middleware function
 * @example
 * router.get('/reports', protect, checkAnyPermission('audit:read', 'report:view'), handler)
 */
const checkAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const hasPermission = permissions.some(perm => 
      rbacService.isActionAllowed(req.user, perm)
    );

    if (!hasPermission) {
      logger.warn(`No required permission: ${req.user.username} needs one of: ${permissions.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: `User requires at least one of these permissions: ${permissions.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSION',
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }

    logger.debug(`✓ Permission check passed (OR): ${req.user.username}`);
    next();
  };
};

/**
 * Multiple Permissions (AND) - User needs ALL permissions
 * Useful when multiple actions must all be allowed
 * 
 * @middleware
 * @param {...string} permissions - Permissions (user needs ALL)
 * @returns {Function} Middleware function
 * @example
 * router.delete('/users/:id', protect, checkAllPermissions('users:read', 'users:delete'), handler)
 */
const checkAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
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
        code: 'INSUFFICIENT_PERMISSION',
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }

    logger.debug(`✓ Permission check passed (AND): ${req.user.username}`);
    next();
  };
};

/**
 * Check if user is admin (convenience middleware)
 * Shortcut for authorize('admin')
 * 
 * @middleware
 * @returns {Function} Middleware function
 * @example
 * router.delete('/all-users', protect, isAdmin, handler)
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Admin action attempted by non-admin: ${req.user.username} (${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'This action requires administrator privileges',
      code: 'ADMIN_REQUIRED',
      userRole: req.user.role
    });
  }

  next();
};

/**
 * Optional Authentication - User may or may not be authenticated
 * Useful for endpoints that show different data based on auth status
 * 
 * @middleware
 * @returns {Function} Middleware function
 * @example
 * router.get('/public-data', optionalAuth, handler)
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    logger.debug('Optional auth: No valid token found');
  }

  next();
};

/**
 * Generate JWT token for authenticated user
 * Called during login/registration to create session token
 * 
 * @param {string} userId - MongoDB ObjectId of user
 * @returns {string} JWT token valid for 7 days (configurable)
 * @example
 * const token = generateToken(user._id);
 * res.json({ token, user });
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Verify JWT token without user context
 * Useful for validating tokens programmatically
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 * @example
 * try {
 *   const decoded = verifyToken(token);
 *   console.log(decoded.id); // User ID
 * } catch (err) {
 *   console.error('Invalid token');
 * }
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Create a custom authorization middleware
 * For complex permission logic
 * 
 * @param {Function} permissionCheck - Function that returns true/false
 * @returns {Function} Middleware function
 * @example
 * const isOwnerOrAdmin = customAuth((req) => {
 *   return req.user.role === 'admin' || req.user._id.equals(req.params.userId);
 * });
 */
const customAuth = (permissionCheck) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    try {
      if (!permissionCheck(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          code: 'PERMISSION_DENIED'
        });
      }
    } catch (error) {
      logger.error(`Custom auth error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        code: 'AUTH_ERROR'
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  isAdmin,
  optionalAuth,
  generateToken,
  verifyToken,
  customAuth
};
