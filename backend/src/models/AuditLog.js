/**
 * AuditLog Model
 * Immutable audit trail for compliance and security monitoring
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  auditId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'CHANGE_ROLE',
      'CHANGE_PERMISSION',
      'LOGIN',
      'LOGOUT',
      'FAILED_LOGIN',
      'MFA_ENABLED',
      'MFA_DISABLED',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET',
      'API_KEY_GENERATED',
      'API_KEY_REVOKED',
      'UPDATE_GENERAL_SETTINGS',
      'UPDATE_SECURITY_SETTINGS',
      'UPDATE_STORAGE_SETTINGS',
      'UPDATE_API_WEBHOOK_SETTINGS',
      'UPDATE_NOTIFICATIONS',
      'UPDATE_ALERT_THRESHOLDS',
      'UPDATE_ANOMALY_DETECTION',
      'EXPORT_DATA',
      'DELETE_DATA',
      'ARCHIVE_DATA',
      'RESTORE_DATA',
      'MODEL_RETRAIN',
      'AUTO_BLOCK',
      'GLOBAL_SENSITIVITY_CHANGE',
      'LOG_EXPORT',
      'DATABASE_BACKUP',
      'DATABASE_RESTORE',
      'SECURITY_SCAN',
      'VULNERABILITY_DETECTED',
      'PERMISSION_CHANGE',
      'ROLE_ASSIGNMENT',
      'MFA_VERIFICATION',
      'SESSION_TIMEOUT',
      'FORCE_LOGOUT',
      'UNKNOWN'
    ],
    index: true
  },
  resourceType: {
    type: String,
    enum: [
      'USER',
      'ROLE',
      'PERMISSION',
      'SETTINGS',
      'LOG',
      'ANOMALY',
      'ALERT',
      'API_KEY',
      'SESSION',
      'DATABASE',
      'REPORT',
      'WEBHOOK',
      'MODEL',
      'SYSTEM'
    ],
    default: 'SYSTEM'
  },
  resourceTarget: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS',
    index: true
  },
  ipAddress: {
    type: String,
    default: 'Internal'
  },
  userAgent: {
    type: String
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  reason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  // Compliance fields
  immutable: {
    type: Boolean,
    default: true
  },
  retention: {
    type: Number,
    default: 365 // days
  }
}, {
  timestamps: true,
  collection: 'auditLogs'
});

// Indexes for fast queries
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceTarget: 1 });

// Prevent updates to maintain immutability
auditLogSchema.pre('updateOne', function() {
  throw new Error('Audit logs are immutable and cannot be modified');
});

auditLogSchema.pre('findByIdAndUpdate', function() {
  throw new Error('Audit logs are immutable and cannot be modified');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
