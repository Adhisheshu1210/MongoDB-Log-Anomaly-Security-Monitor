import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

// Logs API
export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getById: (id) => api.get(`/logs/${id}`),
  getRecent: (limit) => api.get(`/logs/recent/${limit}`),
  create: (data) => api.post('/logs', data),
  delete: (id) => api.delete(`/logs/${id}`),
  deleteMany: (params) => api.delete('/logs', { params })
};

// Anomalies API
export const anomaliesAPI = {
  getAll: (params) => api.get('/anomalies', { params }),
  getById: (id) => api.get(`/anomalies/${id}`),
  getRecent: (limit) => api.get(`/anomalies/recent/${limit}`),
  create: (data) => api.post('/anomalies', data),
  resolve: (id) => api.put(`/anomalies/${id}/resolve`),
  delete: (id) => api.delete(`/anomalies/${id}`)
};

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  getRecent: (limit) => api.get(`/alerts/recent/${limit}`),
  create: (data) => api.post('/alerts', data),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
  resolve: (id, data) => api.post(`/alerts/${id}/resolve`, data),
  addNote: (id, data) => api.post(`/alerts/${id}/notes`, data),
  delete: (id) => api.delete(`/alerts/${id}`)
};

// Stats API
export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
  getLogsByLevel: (params) => api.get('/stats/logs-by-level', { params }),
  getLogsByTime: (params) => api.get('/stats/logs-by-time', { params }),
  getLogsByComponent: (params) => api.get('/stats/logs-by-component', { params }),
  getAnomaliesByType: (params) => api.get('/stats/anomalies-by-type', { params }),
  getAnomaliesBySeverity: () => api.get('/stats/anomalies-by-severity'),
  getClassification: () => api.get('/stats/classification'),
  getTopAnomalies: (params) => api.get('/stats/top-anomalies', { params }),
  generateReport: (format = 'json') => api.get(`/stats/report?format=${format}`, {
    responseType: format === 'csv' ? 'blob' : 'json'
  })
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get(`/settings/${key}`),
  update: (key, data) => api.put(`/settings/${key}`, data),
  create: (data) => api.post('/settings', data),
  init: () => api.post('/settings/init'),
  delete: (key) => api.delete(`/settings/${key}`),
  backup: () => api.get('/settings/backup'),
  restore: (backup) => api.post('/settings/restore', { backup }),
  generateDemo: (options) => api.post('/settings/demo', options),
  clearDemo: () => api.post('/settings/clear-demo')
};

// Demo Data API
export const demoAPI = {
  generate: (options) => api.post('/demo/generate', options),
  clear: () => api.delete('/demo/clear')
};

// System API
export const systemAPI = {
  getMetrics: () => api.get('/system/metrics'),
  getHealth: () => api.get('/system/health'),
  getInfo: () => api.get('/system/info')
};

// Health API
export const healthAPI = {
  get: () => api.get('/health'),
  getReady: () => api.get('/health/ready'),
  getLive: () => api.get('/health/live')
};

// Users API (Admin only)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/users/meta/roles')
};

export default api;

