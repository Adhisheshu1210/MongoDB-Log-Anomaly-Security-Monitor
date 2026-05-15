/**
 * Security Service (Frontend)
 * API calls for security management and threat analysis
 */

import api from './api';

const securityService = {
  /**
   * Get security overview with risk metrics
   */
  getOverview: (params) => api.get('/security/overview', { params }),

  /**
   * Get threat data with filtering
   */
  getThreats: (params) => api.get('/security/threats', { params }),

  /**
   * Get threat map with geo-locations
   */
  getThreatMap: (params) => api.get('/security/threat-map', { params }),

  /**
   * Get attack surface data (hourly breakdown)
   */
  getAttackSurface: (params) => api.get('/security/attack-surface', { params }),

  /**
   * Get active security policies
   */
  getPolicies: () => api.get('/security/policies'),

  /**
   * Get known vulnerabilities
   */
  getVulnerabilities: () => api.get('/security/vulnerabilities'),

  /**
   * Update policy configuration
   */
  updatePolicy: (id, data) => api.put(`/security/policies/${id}`, data),

  /**
   * Generate and execute a dataset-backed patch sequence
   */
  runPatchSequence: (data) => api.post('/security/patch-sequence', data)
};

export default securityService;
