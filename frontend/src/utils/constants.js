/**
 * Application Constants
 * Centralized configuration for the MongoDB Log Anomaly & Security Monitor
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
};

// Permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'manage_users',
    'manage_settings',
    'view_audit_logs',
    'generate_reports',
    'manage_ai_settings',
    'view_infrastructure',
    'manage_security',
    'view_all_logs',
    'view_datasets',
    'manage_datasets',
    'acknowledge_alerts',
    'resolve_alerts',
  ],
  [ROLES.USER]: [
    'view_logs',
    'view_alerts',
    'view_anomalies',
    'view_datasets',
    'acknowledge_alerts',
    'resolve_alerts',
    'add_investigation_notes',
    'view_ai_insights',
  ],
  [ROLES.VIEWER]: [
    'view_logs',
    'view_alerts',
    'view_anomalies',
    'view_datasets',
    'view_dashboard',
  ],
};

// Severity levels
export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
};

export const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#06b6d4',
  info: '#3b82f6',
};

export const SEVERITY_BG_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-cyan-500',
  info: 'bg-blue-500',
};

// Alert statuses
export const ALERT_STATUS = {
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
};

// Anomaly statuses
export const ANOMALY_STATUS = {
  DETECTED: 'detected',
  INVESTIGATING: 'investigating',
  CONFIRMED: 'confirmed',
  FALSE_POSITIVE: 'false_positive',
  RESOLVED: 'resolved',
};

// System health statuses
export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OFFLINE: 'offline',
};

// Chart colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  secondary: '#8b5cf6',
  dark: '#1f2937',
};

// Table pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// Socket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  LOG_NEW: 'log:new',
  ANOMALY_DETECTED: 'anomaly:detected',
  ALERT_NEW: 'alert:new',
  ALERT_RESOLVED: 'alert:resolved',
  ALERT_ACKNOWLEDGED: 'alert:acknowledged',
  NOTIFICATION_NEW: 'notification:new',
  SYSTEM_UPDATE: 'system:update',
  USER_ACTIVITY: 'user:activity',
  HEALTH_UPDATE: 'health:update',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  LOGS: {
    LIST: '/logs',
    SEARCH: '/logs/search',
    EXPORT: '/logs/export',
  },
  ALERTS: {
    LIST: '/alerts',
    ACKNOWLEDGE: '/alerts/:id/acknowledge',
    RESOLVE: '/alerts/:id/resolve',
    ESCALATE: '/alerts/:id/escalate',
  },
  ANOMALIES: {
    LIST: '/anomalies',
    DETAILS: '/anomalies/:id',
    RESOLVE: '/anomalies/:id/resolve',
  },
  STATS: {
    SUMMARY: '/stats/summary',
    HEALTH: '/stats/health',
    REPORT: '/stats/report',
  },
  SYSTEM: {
    HEALTH: '/system/health',
    METRICS: '/system/metrics',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
  },
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
    SMTP: '/settings/smtp',
    NOTIFICATIONS: '/settings/notifications',
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
  PREFERENCES: 'user_preferences',
  THEME: 'theme_preference',
  LAYOUT_STATE: 'layout_state',
};

// Time ranges for filtering
export const TIME_RANGES = {
  ONE_HOUR: '1h',
  SIX_HOURS: '6h',
  TWELVE_HOURS: '12h',
  ONE_DAY: '1d',
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d',
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Toast duration (ms)
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
  PERSISTENT: 0,
};

// Default pagination values
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Debounce delays (ms)
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  FILTER: 500,
  RESIZE: 200,
};

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Feature flags (can be toggled)
export const FEATURE_FLAGS = {
  ENABLE_AI_INSIGHTS: true,
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_REPORTING: true,
  ENABLE_MFA: true,
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  ROLES,
  ROLE_PERMISSIONS,
  SEVERITY_LEVELS,
  SEVERITY_COLORS,
  ALERT_STATUS,
  ANOMALY_STATUS,
  HEALTH_STATUS,
  SOCKET_EVENTS,
  API_ENDPOINTS,
  STORAGE_KEYS,
  TIME_RANGES,
  NOTIFICATION_TYPES,
  TOAST_DURATION,
};
