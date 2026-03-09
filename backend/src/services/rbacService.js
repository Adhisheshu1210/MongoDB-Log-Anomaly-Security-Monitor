/**
 * Role-Based Access Control (RBAC) Service
 * Manages permissions and authorization for different user roles
 * 
 * Roles:
 * - admin: Full system access
 * - user/devops: Limited access (viewing only)
 * - viewer: Read-only access (monitoring only)
 */

const logger = require('../utils/logger');

// ============= ROLE DEFINITIONS =============

const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
};

// ============= PERMISSION DEFINITIONS =============

const PERMISSIONS = {
  // Log access
  'logs:read': ['admin', 'user', 'viewer'],
  'logs:filter': ['admin', 'user', 'viewer'],
  'logs:export': ['admin', 'user'],

  // Anomaly access
  'anomalies:read': ['admin', 'user', 'viewer'],
  'anomalies:resolve': ['admin', 'user'],
  'anomalies:acknowledge': ['admin', 'user', 'viewer'],

  // Alert access
  'alerts:read': ['admin', 'user', 'viewer'],
  'alerts:acknowledge': ['admin', 'user', 'viewer'],
  'alerts:resolve': ['admin', 'user'],

  // Settings access
  'settings:read': ['admin', 'user', 'viewer'],
  'settings:write': ['admin'],
  'settings:backup': ['admin'],
  'settings:restore': ['admin'],

  // Configuration access
  'config:alerts': ['admin'],
  'config:notifications': ['admin'],
  'config:anomaly': ['admin'],
  'config:security': ['admin'],

  // User management
  'users:read': ['admin'],
  'users:create': ['admin'],
  'users:update': ['admin'],
  'users:delete': ['admin'],
  'users:manage-roles': ['admin'],

  // System access
  'system:health': ['admin', 'user', 'viewer'],
  'system:metrics': ['admin', 'user', 'viewer'],
  'system:admin-panel': ['admin'],

  // Demo data access
  'demo:generate': ['admin'],
  'demo:clear': ['admin'],

  // Audit access
  'audit:read': ['admin'],
  'audit:export': ['admin']
};

// ============= ROLE CAPABILITIES =============

const ROLE_CAPABILITIES = {
  admin: {
    description: 'Administrator - Full system access',
    capabilities: [
      'View all logs and anomalies',
      'Configure alert thresholds',
      'Manage notification settings (Email, Slack, Telegram)',
      'Manage users and roles',
      'Access system health metrics and dashboards',
      'Generate and clear demo data',
      'Backup and restore settings',
      'Access audit logs and security reports',
      'Configure anomaly detection algorithms',
      'Manage security policies'
    ]
  },
  user: {
    description: 'User / DevOps Member - Limited access',
    capabilities: [
      'View logs and anomaly alerts',
      'Monitor system dashboard',
      'Check performance metrics',
      'Acknowledge alerts',
      'Resolve anomalies',
      'Access audit logs (read-only)'
    ]
  },
  viewer: {
    description: 'Viewer - Read-only access',
    capabilities: [
      'View logs (read-only)',
      'View anomalies (read-only)',
      'View alerts (read-only)',
      'View system metrics (read-only)',
      'Acknowledge alerts only'
    ]
  }
};

// ============= RESOURCE PERMISSIONS =============

const RESOURCE_PERMISSIONS = {
  // Settings resources
  '/api/settings': {
    GET: ['admin', 'user', 'viewer'],
    POST: ['admin'],
    PUT: ['admin'],
    DELETE: ['admin']
  },
  '/api/settings/backup': {
    GET: ['admin']
  },
  '/api/settings/restore': {
    POST: ['admin']
  },
  '/api/settings/demo': {
    POST: ['admin']
  },
  '/api/settings/clear-demo': {
    POST: ['admin']
  },

  // Logs resources
  '/api/logs': {
    GET: ['admin', 'user', 'viewer'],
    POST: ['admin']
  },
  '/api/logs/:id': {
    GET: ['admin', 'user', 'viewer'],
    PUT: ['admin'],
    DELETE: ['admin']
  },

  // Anomalies resources
  '/api/anomalies': {
    GET: ['admin', 'user', 'viewer'],
    POST: ['admin', 'user']
  },
  '/api/anomalies/:id': {
    GET: ['admin', 'user', 'viewer'],
    PUT: ['admin', 'user'],
    DELETE: ['admin']
  },

  // Alerts resources
  '/api/alerts': {
    GET: ['admin', 'user', 'viewer'],
    POST: ['admin']
  },
  '/api/alerts/:id': {
    GET: ['admin', 'user', 'viewer'],
    PUT: ['admin', 'user'],
    DELETE: ['admin']
  },

  // Users resources
  '/api/users': {
    GET: ['admin'],
    POST: ['admin']
  },
  '/api/users/:id': {
    GET: ['admin'],
    PUT: ['admin'],
    DELETE: ['admin']
  },

  // System resources
  '/api/system/health': {
    GET: ['admin', 'user', 'viewer']
  },
  '/api/system/metrics': {
    GET: ['admin', 'user', 'viewer']
  },
  '/api/system/info': {
    GET: ['admin', 'user', 'viewer']
  },

  // Settings Management routes
  '/api/settings-management/categories/alert-thresholds': {
    GET: ['admin', 'user', 'viewer'],
    PUT: ['admin']
  },
  '/api/settings-management/categories/notifications': {
    GET: ['admin', 'user'],
    PUT: ['admin'],
    POST: ['admin']
  },
  '/api/settings-management/categories/anomaly-detection': {
    GET: ['admin', 'user', 'viewer'],
    PUT: ['admin'],
    POST: ['admin']
  },
  '/api/settings-management/categories/security': {
    GET: ['admin'],
    PUT: ['admin'],
    POST: ['admin']
  }
};

// ============= RBAC SERVICE CLASS =============

class RBACService {
  /**
   * Check if user role has a specific permission
   * @param {String} role - User role
   * @param {String} permission - Permission to check
   * @returns {Boolean}
   */
  static hasPermission(role, permission) {
    if (!PERMISSIONS[permission]) {
      logger.warn(`Unknown permission: ${permission}`);
      return false;
    }
    return PERMISSIONS[permission].includes(role);
  }

  /**
   * Check if user can perform action on resource
   * @param {String} role - User role
   * @param {String} resource - Resource path
   * @param {String} method - HTTP method
   * @returns {Boolean}
   */
  static canAccessResource(role, resource, method = 'GET') {
    const resourcePerms = RESOURCE_PERMISSIONS[resource];
    if (!resourcePerms) {
      logger.warn(`Unknown resource: ${resource}`);
      return false;
    }
    const methodPerms = resourcePerms[method];
    if (!methodPerms) {
      return false;
    }
    return methodPerms.includes(role);
  }

  /**
   * Get all permissions for a role
   * @param {String} role - User role
   * @returns {Array}
   */
  static getRolePermissions(role) {
    return Object.keys(PERMISSIONS).filter(perm => 
      PERMISSIONS[perm].includes(role)
    );
  }

  /**
   * Get role capabilities and description
   * @param {String} role - User role
   * @returns {Object}
   */
  static getRoleCapabilities(role) {
    return ROLE_CAPABILITIES[role] || null;
  }

  /**
   * Get all roles and their capabilities
   * @returns {Object}
   */
  static getAllRolesCapabilities() {
    return ROLE_CAPABILITIES;
  }

  /**
   * Check if action is allowed for user
   * @param {Object} user - User object with role
   * @param {String} action - Action to perform
   * @returns {Boolean}
   */
  static isActionAllowed(user, action) {
    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
  }

  /**
   * Get error message for unauthorized action
   * @param {String} action - Action being attempted
   * @param {String} role - User role
   * @returns {String}
   */
  static getUnauthorizedMessage(action, role) {
    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles) {
      return `Action '${action}' is not recognized`;
    }
    return `Role '${role}' is not authorized to perform action '${action}'. Required roles: ${allowedRoles.join(', ')}`;
  }

  /**
   * Validate user can access resource
   * @param {Object} user - User object with role
   * @param {String} resourcePath - Resource path
   * @param {String} method - HTTP method
   * @returns {Object} { allowed: Boolean, message: String }
   */
  static validateAccess(user, resourcePath, method = 'GET') {
    const allowed = this.canAccessResource(user.role, resourcePath, method);
    
    if (!allowed) {
      const resourcePerms = RESOURCE_PERMISSIONS[resourcePath];
      const methodPerms = resourcePerms ? resourcePerms[method] : [];
      return {
        allowed: false,
        message: `Role '${user.role}' cannot perform ${method} on ${resourcePath}. Allowed roles: ${methodPerms.join(', ') || 'None'}`,
        requiredRoles: methodPerms || []
      };
    }

    return {
      allowed: true,
      message: 'Access granted'
    };
  }

  /**
   * Filter data based on user role
   * @param {Object} user - User object with role
   * @param {Array} data - Data to filter
   * @param {String} role - Role to filter
   * @returns {Array}
   */
  static filterByRole(user, data, roleField = 'role') {
    if (user.role === 'admin') {
      return data; // Admin sees all
    }

    if (user.role === 'user') {
      // User doesn't see admin-only data
      return data.filter(item => item[roleField] !== 'admin');
    }

    // Viewer sees only non-sensitive data
    return data.filter(item => 
      item.isPublic === true || item[roleField] === user.role
    );
  }

  /**
   * Get audit log message for action
   * @param {Object} user - User object
   * @param {String} action - Action performed
   * @param {String} resource - Resource affected
   * @param {Boolean} success - Whether action succeeded
   * @returns {String}
   */
  static getAuditMessage(user, action, resource, success = true) {
    const status = success ? 'SUCCESS' : 'FAILED';
    return `[${status}] User ${user.username} (${user.role}) performed '${action}' on ${resource}`;
  }
}

module.exports = RBACService;
module.exports.ROLES = ROLES;
module.exports.PERMISSIONS = PERMISSIONS;
module.exports.ROLE_CAPABILITIES = ROLE_CAPABILITIES;
