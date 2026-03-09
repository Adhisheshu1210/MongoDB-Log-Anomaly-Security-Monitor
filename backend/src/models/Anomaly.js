/**
 * Anomaly Model
 * Stores detected anomalies from AI processing
 */

const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
  logId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Log',
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['security', 'performance', 'capacity', 'replication', 'connection', 'query', 'resource', 'unknown'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    logMessage: String,
    component: String,
    queryDuration: Number,
    connectionCount: Number,
    errorCode: String,
    affectedUsers: [String],
    affectedCollections: [String],
    threshold: Number,
    actualValue: Number
  },
  anomalyScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  algorithm: {
    type: String,
    enum: ['isolation_forest', 'lof', 'autoencoder', 'rule_based'],
    default: 'rule_based'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  recommendedAction: {
    type: String
  },
  isResolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  source: {
    type: String,
    default: 'system',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes
anomalySchema.index({ timestamp: -1, severity: 1 });
anomalySchema.index({ type: 1, isResolved: 1 });
anomalySchema.index({ anomalyScore: -1, timestamp: -1 });

module.exports = mongoose.model('Anomaly', anomalySchema);

