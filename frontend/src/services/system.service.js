/**
 * System Service
 * System monitoring and health check API calls
 */

import api from './api';

export const getSystemHealth = async () => {
  return api.get('/system/health');
};

export const getSystemMetrics = async () => {
  return api.get('/system/metrics');
};

export default {
  getSystemHealth,
  getSystemMetrics,
};
