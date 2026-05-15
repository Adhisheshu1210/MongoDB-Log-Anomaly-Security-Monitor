/**
 * Settings Service
 * Application settings and configuration API calls
 */

import api from './api';

// ============= GENERAL SETTINGS =============
export const getGeneralSettings = async () => {
  return api.get('/settings/categories/general');
};

export const updateGeneralSettings = async (data) => {
  return api.put('/settings/categories/general', data);
};

// ============= SECURITY SETTINGS =============
export const getSecuritySettings = async () => {
  return api.get('/settings/categories/security');
};

export const updateSecuritySettings = async (data) => {
  return api.put('/settings/categories/security', data);
};

export const getAuditLog = async (params) => {
  return api.get('/settings/categories/security/audit-log', { params });
};

export const validatePassword = async (password) => {
  return api.post('/settings/categories/security/password-validation', { password });
};

// ============= API & WEBHOOKS =============
export const getApiWebhookSettings = async () => {
  return api.get('/settings/categories/api-webhooks');
};

export const updateApiWebhookSettings = async (data) => {
  return api.put('/settings/categories/api-webhooks', data);
};

export const generateApiKey = async () => {
  return api.post('/settings/categories/api-webhooks/generate-key');
};

export const revokeApiKey = async (keyId) => {
  return api.post('/settings/categories/api-webhooks/revoke-key', { keyId });
};

// ============= STORAGE SETTINGS =============
export const getStorageSettings = async () => {
  return api.get('/settings/categories/storage');
};

export const updateStorageSettings = async (data) => {
  return api.put('/settings/categories/storage', data);
};

// ============= NOTIFICATIONS =============
export const getNotificationSettings = async () => {
  return api.get('/settings/categories/notifications');
};

export const updateNotificationSettings = async (data) => {
  return api.put('/settings/categories/notifications', data);
};

export const testNotifications = async () => {
  return api.post('/settings/categories/notifications/test');
};

// ============= ALERT THRESHOLDS =============
export const getAlertThresholds = async () => {
  return api.get('/settings/categories/alert-thresholds');
};

export const updateAlertThresholds = async (data) => {
  return api.put('/settings/categories/alert-thresholds', data);
};

export const testAlerts = async (data) => {
  return api.post('/settings/categories/alert-thresholds/test', data);
};

// ============= ANOMALY DETECTION =============
export const getAnomalyDetection = async () => {
  return api.get('/settings/categories/anomaly-detection');
};

export const updateAnomalyDetection = async (data) => {
  return api.put('/settings/categories/anomaly-detection', data);
};

export const runAnomalyDetection = async () => {
  return api.post('/settings/categories/anomaly-detection/run');
};

// Legacy exports for backward compatibility
export const getSettings = async () => {
  return api.get('/settings');
};

export const updateSettings = async (data) => {
  return api.put('/settings', data);
};

export const updateSMTPSettings = async (data) => {
  return api.put('/settings/smtp', data);
};

export const getAnomalyThreshold = async () => {
  return api.get('/settings/anomaly-threshold');
};

export const updateAnomalyThreshold = async (threshold) => {
  return api.put('/settings/anomaly-threshold', { threshold });
};

export default {
  getGeneralSettings,
  updateGeneralSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getAuditLog,
  validatePassword,
  getApiWebhookSettings,
  updateApiWebhookSettings,
  generateApiKey,
  revokeApiKey,
  getStorageSettings,
  updateStorageSettings,
  getNotificationSettings,
  updateNotificationSettings,
  testNotifications,
  getAlertThresholds,
  updateAlertThresholds,
  testAlerts,
  getAnomalyDetection,
  updateAnomalyDetection,
  runAnomalyDetection,
  // Legacy
  getSettings,
  updateSettings,
  updateSMTPSettings,
  getAnomalyThreshold,
  updateAnomalyThreshold,
};
