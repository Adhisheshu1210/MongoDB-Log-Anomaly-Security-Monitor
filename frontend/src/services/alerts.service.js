/**
 * Alerts Service
 * Alert management API calls
 */

import api from './api';

export const getAlerts = async (params = {}) => {
  return api.get('/alerts', { params });
};

export const getAlertById = async (id) => {
  return api.get(`/alerts/${id}`);
};

export const acknowledgeAlert = async (id) => {
  return api.put(`/alerts/${id}/acknowledge`);
};

export const resolveAlert = async (id) => {
  return api.put(`/alerts/${id}/resolve`);
};

export const escalateAlert = async (id) => {
  return api.put(`/alerts/${id}/escalate`);
};

export const getAlertStats = async () => {
  return api.get('/alerts/stats');
};

export default {
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  escalateAlert,
  getAlertStats,
};
