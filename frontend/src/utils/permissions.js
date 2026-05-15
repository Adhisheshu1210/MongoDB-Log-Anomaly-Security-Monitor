/**
 * Permission Helper Functions
 * Manages role-based access control
 */

import { ROLES, ROLE_PERMISSIONS } from './constants.js';

export const normalizeRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized === ROLES.ADMIN) return ROLES.ADMIN;
  if (normalized === ROLES.VIEWER) return ROLES.VIEWER;
  return ROLES.USER;
};

/**
 * Check if user has a specific permission
 * @param {string} userRole - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
export const hasPermission = (userRole, permission) => {
  const role = normalizeRole(userRole);
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {string} userRole - The user's role
 * @param {string[]} permissions - The permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {string} userRole - The user's role
 * @param {string[]} permissions - The permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Get all permissions for a role
 * @param {string} userRole - The user's role
 * @returns {string[]}
 */
export const getRolePermissions = (userRole) => {
  return ROLE_PERMISSIONS[normalizeRole(userRole)] || [];
};

/**
 * Check if user can perform an action based on role
 * @param {string} userRole - The user's role
 * @param {string} action - The action to perform
 * @returns {boolean}
 */
export const canPerformAction = (userRole, action) => {
  const actionPermissionMap = {
    'edit_user': 'manage_users',
    'delete_user': 'manage_users',
    'create_user': 'manage_users',
    'edit_settings': 'manage_settings',
    'view_reports': 'generate_reports',
    'generate_report': 'generate_reports',
    'edit_ai_settings': 'manage_ai_settings',
    'view_infrastructure': 'view_infrastructure',
    'acknowledge_alert': 'acknowledge_alerts',
    'resolve_alert': 'resolve_alerts',
    'escalate_alert': 'acknowledge_alerts',
    'add_note': 'add_investigation_notes',
    'view_audit_logs': 'view_audit_logs',
  };

  const requiredPermission = actionPermissionMap[action];
  if (!requiredPermission) return false;

  return hasPermission(userRole, requiredPermission);
};

/**
 * Get accessible pages for a role
 * @param {string} userRole - The user's role
 * @returns {string[]}
 */
export const getAccessiblePages = (userRole) => {
  const role = normalizeRole(userRole);
  const pageMap = {
    [ROLES.ADMIN]: [
      '/admin/dashboard',
      '/admin/datasets',
      '/admin/users',
      '/admin/settings',
      '/admin/reports',
      '/admin/security-center',
      '/admin/infrastructure',
      '/admin/audit-logs',
      '/admin/ai-controls',
      '/admin/profile',
    ],
    [ROLES.USER]: [
      '/user/dashboard',
      '/user/live-monitoring',
      '/user/datasets',
      '/user/logs',
      '/user/alerts',
      '/user/anomalies',
      '/user/investigations',
      '/user/ai-insights',
      '/user/profile',
    ],
    [ROLES.VIEWER]: [
      '/viewer/dashboard',
      '/viewer/datasets',
      '/viewer/live-monitoring',
      '/viewer/logs',
      '/viewer/alerts',
      '/viewer/profile',
    ],
  };

  return pageMap[role] || [];
};

/**
 * Check if user can access a specific page
 * @param {string} userRole - The user's role
 * @param {string} page - The page path to check
 * @returns {boolean}
 */
export const canAccessPage = (userRole, page) => {
  if (!page) return false;
  const accessiblePages = getAccessiblePages(userRole);
  return accessiblePages.some((p) => page === p || page.startsWith(`${p}/`));
};

/**
 * Get the home page for a role
 * @param {string} userRole - The user's role
 * @returns {string}
 */
export const getRoleHomePage = (userRole) => {
  const role = normalizeRole(userRole);
  const homePageMap = {
    [ROLES.ADMIN]: '/admin/dashboard',
    [ROLES.USER]: '/user/dashboard',
    [ROLES.VIEWER]: '/viewer/dashboard',
  };

  return homePageMap[role] || '/user/dashboard';
};

/**
 * Validate if a user role is valid
 * @param {string} role - The role to validate
 * @returns {boolean}
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(normalizeRole(role));
};

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  normalizeRole,
  canPerformAction,
  getAccessiblePages,
  canAccessPage,
  getRoleHomePage,
  isValidRole,
};
