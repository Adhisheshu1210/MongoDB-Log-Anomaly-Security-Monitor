/**
 * Settings Service
 * Application settings and configuration API calls
 */

import api from './api';

export const getSettings = async () => {
  return api.get('/settings');
};

export const updateSettings = async (data) => {
  return api.put('/settings', data);
};

export const updateSMTPSettings = async (data) => {
  return api.put('/settings/smtp', data);
};

export const updateNotificationSettings = async (data) => {
  return api.put('/settings/notifications', data);
};

export const getAnomalyThreshold = async () => {
  return api.get('/settings/anomaly-threshold');
};

export const updateAnomalyThreshold = async (threshold) => {
  return api.put('/settings/anomaly-threshold', { threshold });
};

export default {
  getSettings,
  updateSettings,
  updateSMTPSettings,
  updateNotificationSettings,
  getAnomalyThreshold,
  updateAnomalyThreshold,
};
