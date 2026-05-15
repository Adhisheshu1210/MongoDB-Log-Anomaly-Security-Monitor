/**
 * Audit Logs Service (Frontend)
 * API calls for audit trail and compliance reporting
 */

import api from './api';

const auditLogsService = {
  /**
   * Get audit logs with pagination, filtering, and search
   */
  getAuditLogs: (params) => api.get('/audit-logs', { params }),

  /**
   * Get audit log statistics
   */
  getStats: () => api.get('/audit-logs/stats'),

  /**
   * Get available action types
   */
  getActions: () => api.get('/audit-logs/actions'),

  /**
   * Get single audit log details
   */
  getLogDetails: (id) => api.get(`/audit-logs/${id}`),

  /**
   * Export audit logs as JSON
   */
  exportLogs: (filters) => api.post('/audit-logs/export', { filters }),

  /**
   * Verify audit log integrity
   */
  verifyIntegrity: () => api.get('/audit-logs/integrity/verify')
};

export default auditLogsService;
