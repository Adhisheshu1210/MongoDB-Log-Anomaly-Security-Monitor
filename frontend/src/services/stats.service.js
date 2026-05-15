/**
 * Stats Service
 * Statistics and reporting API calls
 */

import api from './api';

export const getSummary = async () => {
  return api.get('/stats/summary');
};

export const getHealth = async () => {
  return api.get('/stats/health');
};

export const getReport = async (format = 'json', params = {}) => {
  return api.get(`/stats/report?format=${format}`, { params });
};

export const downloadReport = async (format = 'json') => {
  const response = await api.get(`/stats/report?format=${format}`, {
    responseType: 'blob',
  });
  return response;
};

export const getMetrics = async () => {
  return api.get('/stats/metrics');
};

export const getDashboard = async () => {
  return api.get('/stats/dashboard');
};

export const getSiemDatasetStats = async () => {
  return api.get('/siem-dataset/stats');
};

export default {
  getSummary,
  getHealth,
  getReport,
  downloadReport,
  getMetrics,
  getDashboard,
  getSiemDatasetStats,
};
