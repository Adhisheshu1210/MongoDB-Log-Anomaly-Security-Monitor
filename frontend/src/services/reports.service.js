/**
 * Reports Service (Frontend)
 * API calls for generating, listing, downloading, and scheduling reports.
 */

import api from './api';

const reportsService = {
  getReports: (params) => api.get('/reports', { params }),
  getSummary: () => api.get('/reports/summary'),
  getReport: (reportId) => api.get(`/reports/${reportId}`),
  generateReport: (data) => api.post('/reports/generate', data),
  sendReport: (reportId, data) => api.post(`/reports/${reportId}/send`, data),
  downloadReport: (reportId, format = 'json') => api.get(`/reports/${reportId}/download`, {
    params: { format },
    responseType: 'blob'
  }),
  scheduleReport: (reportId, data) => api.post(`/reports/${reportId}/schedule`, data)
  ,getArchives: (params) => api.get('/reports/archives', { params })
};

export default reportsService;