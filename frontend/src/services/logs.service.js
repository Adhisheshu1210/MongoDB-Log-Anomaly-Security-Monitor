/**
 * Logs Service
 * Log management API calls
 */

import api from './api';

export const getLogs = async (params = {}) => {
  return api.get('/logs', { params });
};

export const getLogById = async (id) => {
  return api.get(`/logs/${id}`);
};

export const searchLogs = async (query, params = {}) => {
  return api.get('/logs/search', { params: { ...params, q: query } });
};

export const exportLogs = async (format = 'json') => {
  return api.get(`/logs/export?format=${format}`);
};

export const filterLogs = async (filters = {}) => {
  return api.get('/logs', { params: filters });
};

export default {
  getLogs,
  getLogById,
  searchLogs,
  exportLogs,
  filterLogs,
};
