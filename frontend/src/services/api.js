/**
 * API Service Base Configuration
 * Axios instance with interceptors for JWT handling
 */

import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

const API_URL = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create base API instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If requires verification, allow calling code to handle
      if (error.response?.data?.requiresVerification) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data.data;
          localStorage.setItem('token', token);
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('token');
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem('user');
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }

      // No refresh token - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem('user');
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }

    // Handle 403 - Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      window.location.href = '/unauthorized';
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

// Extended auth flows (forgot password / otp)
authAPI.requestPasswordReset = (data) => api.post('/auth/forgot', data);
authAPI.verifyOtp = (data) => api.post('/auth/verify-otp', data);
authAPI.sendOtp = (data) => api.post('/auth/send-otp', data);
authAPI.resetPassword = (data) => api.post('/auth/reset-password', data);

// Logs API
export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getLogs: (params) => api.get('/logs', { params }).then((res) => ({ ...res, data: res.data?.data || [] })),
  getById: (id) => api.get(`/logs/${id}`),
  getRecent: (limit) => api.get(`/logs/recent/${limit}`),
  create: (data) => api.post('/logs', data),
  delete: (id) => api.delete(`/logs/${id}`),
  deleteMany: (params) => api.delete('/logs', { params })
};

// Anomalies API
export const anomaliesAPI = {
  getAll: (params) => api.get('/anomalies', { params }),
  getAnomalies: (params) => api.get('/anomalies', { params }).then((res) => ({ ...res, data: res.data?.data || [] })),
  getById: (id) => api.get(`/anomalies/${id}`),
  getRecent: (limit) => api.get(`/anomalies/recent/${limit}`),
  create: (data) => api.post('/anomalies', data),
  resolve: (id) => api.put(`/anomalies/${id}/resolve`),
  delete: (id) => api.delete(`/anomalies/${id}`)
};

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getAlerts: (params) => api.get('/alerts', { params }).then((res) => ({
    ...res,
    data: {
      alerts: res.data?.data || [],
      total: res.data?.pagination?.total || 0,
      pagination: res.data?.pagination || null
    }
  })),
  getById: (id) => api.get(`/alerts/${id}`),
  getRecent: (limit) => api.get(`/alerts/recent/${limit}`),
  create: (data) => api.post('/alerts', data),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
  resolve: (id, data) => api.post(`/alerts/${id}/resolve`, data),
  updateStatus: (id, status) => {
    if (status === 'acknowledged') return api.post(`/alerts/${id}/acknowledge`);
    if (status === 'resolved') return api.post(`/alerts/${id}/resolve`, {});
    return Promise.reject(new Error(`Unsupported alert status action: ${status}`));
  },
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

// Contact API - used by public landing page contact form
export const contactAPI = {
  submit: (data) => api.post('/contact', data)
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

// SIEM Dataset API
export const siemDatasetAPI = {
  getAll: (params) => api.get('/siem-dataset', { params }),
  getStats: (params) => api.get('/siem-dataset/stats', { params }),
  importAll: (data) => api.post('/siem-dataset/import', data),
  syncToCore: (data) => api.post('/siem-dataset/sync', data)
};

// Notifications API
export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  stats: () => api.get('/notifications/stats'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

// AI Controls API
export const aiAPI = {
  getDashboard: () => api.get('/ai-controls'),
  getMetrics: () => api.get('/ai-controls/metrics'),
  getActivity: (params) => api.get('/ai-controls/activity', { params }),
  updateSettings: (data) => api.put('/ai-controls/settings', data),
  retrain: (data) => api.post('/ai-controls/retrain', data)
};

export default api;

