/**
 * Security Service
 * Handles security policies, access control, and audit logging
 */

const User = require('../models/User');
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

class SecurityService {
  constructor() {
    this.settings = null;
    this.auditLogs = [];
  }

  /**
   * Initialize security settings
   */
  async initialize() {
    try {
      const settings = await Settings.findOne({ key: 'security' });
      if (settings) {
        this.settings = settings.value;
        logger.info('Security service initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize security service:', error.message);
    }
  }

  /**
   * Track login attempt
   */
  async trackLoginAttempt(username, ipAddress, success = false) {
    try {
      const user = await User.findOne({ username });
      if (!user) return null;

      if (!user.loginAttempts) user.loginAttempts = [];
      
      const attempt = {
        timestamp: new Date(),
        ipAddress,
        success
      };

      user.loginAttempts.push(attempt);
      // Keep only last 10 attempts
      if (user.loginAttempts.length > 10) {
        user.loginAttempts = user.loginAttempts.slice(-10);
      }

      await user.save();

      // Check for brute force
      const failedAttempts = user.loginAttempts.filter(
        a => !a.success && a.timestamp > new Date(Date.now() - 60 * 60 * 1000)
      ).length;

      if (failedAttempts >= (this.settings?.maxLoginAttempts || 5)) {
        // Create security alert
        await Alert.create({
          title: 'Brute Force Attack Detected',
          message: `Multiple failed login attempts for user '${username}' from IP ${ipAddress}`,
          severity: 'critical',
          category: 'security',
          source: 'system',
          metadata: { username, ipAddress, failedAttempts }
        });

        // Temporarily lock account
        user.isActive = false;
        await user.save();
        
        logger.warn(`Account locked due to brute force: ${username}`);
      }

      return attempt;
    } catch (error) {
      logger.error('Login tracking error:', error.message);
      return null;
    }
  }

  /**
   * Audit log an action
   */
  async auditLog(action, userId, resource, details = {}) {
    try {
      const logEntry = {
        timestamp: new Date(),
        action,
        userId,
        resource,
        details,
        ipAddress: details.ipAddress || 'unknown'
      };

      this.auditLogs.push(logEntry);
      logger.info(`Audit: ${action} by ${userId} on ${resource}`);

      // Keep last 1000 entries in memory
      if (this.auditLogs.length > 1000) {
        this.auditLogs = this.auditLogs.slice(-1000);
      }

      return logEntry;
    } catch (error) {
      logger.error('Audit log error:', error.message);
      return null;
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(filters = {}) {
    let logs = [...this.auditLogs];

    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters.resource) {
      logs = logs.filter(l => l.resource === filters.resource);
    }

    return logs.reverse();
  }

  /**
   * Check user permissions
   */
  async checkPermission(userId, permission) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) return false;

      const rolePermissions = {
        admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
        user: ['read', 'write', 'acknowledge_alerts'],
        viewer: ['read']
      };

      const userPermissions = rolePermissions[user.role] || [];
      return userPermissions.includes(permission);
    } catch (error) {
      logger.error('Permission check error:', error.message);
      return false;
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport() {
    try {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        recentAlerts,
        failedLogins
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
        Alert.find({ category: 'security' })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        User.aggregate([
          { $unwind: '$loginAttempts' },
          { $match: { 'loginAttempts.success': false } },
          { $group: { 
            _id: '$username',
            failedAttempts: { $sum: 1 },
            lastAttempt: { $max: '$loginAttempts.timestamp' }
          }},
          { $sort: { failedAttempts: -1 } },
          { $limit: 10 }
        ])
      ]);

      const auditStats = {
        totalActions: this.auditLogs.length,
        topActions: this.auditLogs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {})
      };

      return {
        timestamp: new Date(),
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        },
        securityAlerts: {
          recent: recentAlerts.length,
          alerts: recentAlerts
        },
        failedLogins,
        auditStatistics: auditStats,
        settings: this.settings
      };
    } catch (error) {
      logger.error('Security report generation error:', error.message);
      return null;
    }
  }

  /**
   * Reset user login attempts
   */
  async resetLoginAttempts(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      user.loginAttempts = [];
      user.isActive = true;
      await user.save();

      logger.info(`Login attempts reset for user: ${user.username}`);
      return user;
    } catch (error) {
      logger.error('Reset login attempts error:', error.message);
      return null;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const minLength = this.settings?.passwordMinLength || 8;
    const minLengthOk = password.length >= minLength;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    return {
      isValid: minLengthOk && hasUpper && hasLower && hasNumber,
      requirements: {
        minLength: { met: minLengthOk, length: minLength },
        uppercase: { met: hasUpper },
        lowercase: { met: hasLower },
        number: { met: hasNumber },
        special: { met: hasSpecial }
      }
    };
  }

  /**
   * MFA validation (mock implementation)
   */
  async validateMFA(userId, code) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.mfaEnabled) return false;

      // In production, integrate with actual MFA provider
      // This is a mock implementation
      logger.debug(`MFA validation for user: ${user.username}`);
      return true;
    } catch (error) {
      logger.error('MFA validation error:', error.message);
      return false;
    }
  }

  /**
   * Session timeout enforcement
   */
  checkSessionTimeout(lastActivity) {
    const timeoutMinutes = this.settings?.sessionTimeout || 3600;
    const sessionExpiry = new Date(lastActivity.getTime() + timeoutMinutes * 1000);
    return sessionExpiry > new Date();
  }
}

module.exports = new SecurityService();
