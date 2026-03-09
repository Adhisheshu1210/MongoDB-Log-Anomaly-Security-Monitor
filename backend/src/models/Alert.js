/**
 * Alert Model
 * Stores alerts triggered by anomalies or system rules
 */

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['security', 'performance', 'capacity', 'replication', 'connection', 'query', 'resource', 'system', 'unknown'],
    required: true
  },
  source: {
    type: String,
    enum: ['anomaly', 'rule', 'system', 'manual', 'demo'],
    default: 'anomaly'
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'source'
  },
  anomalyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anomaly'
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'investigating', 'resolved', 'dismissed'],
    default: 'new',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: {
    type: Date
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    text: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notifications: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date }
    },
    slack: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date }
    },
    telegram: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date }
    }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    endpoint: String,
    additionalInfo: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound indexes
alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ createdAt: -1, status: 1 });
alertSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);

