/**
 * Anomalies Service
 * Anomaly detection API calls
 */

import api from './api';

export const getAnomalies = async (params = {}) => {
  return api.get('/anomalies', { params });
};

export const getAnomalyById = async (id) => {
  return api.get(`/anomalies/${id}`);
};

export const resolveAnomaly = async (id, notes) => {
  return api.put(`/anomalies/${id}/resolve`, { notes });
};

export const addAnomalyNote = async (id, note) => {
  return api.post(`/anomalies/${id}/notes`, { note });
};

export const getAnomalyStats = async () => {
  return api.get('/anomalies/stats');
};

export default {
  getAnomalies,
  getAnomalyById,
  resolveAnomaly,
  addAnomalyNote,
  getAnomalyStats,
};
