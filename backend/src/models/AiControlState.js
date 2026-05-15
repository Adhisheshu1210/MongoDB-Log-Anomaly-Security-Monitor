/**
 * AI Control State Model
 * Stores global AI configuration, model status, and metrics.
 */

const mongoose = require('mongoose');

const aiControlStateSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    default: 'default',
    index: true
  },
  modelName: {
    type: String,
    default: 'Sentinel-NLP-v4'
  },
  modelVersion: {
    type: String,
    default: 'v4.0.0'
  },
  status: {
    type: String,
    enum: ['active', 'training', 'paused', 'error'],
    default: 'active',
    index: true
  },
  sensitivity: {
    type: Number,
    min: 0,
    max: 100,
    default: 72
  },
  controls: {
    deepPacketInspection: { type: Boolean, default: true },
    anomalyAutoCluster: { type: Boolean, default: true },
    selfHealingRules: { type: Boolean, default: false },
    predictiveAnalytics: { type: Boolean, default: true }
  },
  metrics: {
    precision: { type: Number, default: 120 },
    recall: { type: Number, default: 98 },
    latency: { type: Number, default: 86 },
    f1Score: { type: Number, default: 99 },
    accuracy: { type: Number, default: 85 }
  },
  summary: {
    logsAnalyzed: { type: Number, default: 0 },
    anomaliesObserved: { type: Number, default: 0 },
    lastEvaluationAt: { type: Date }
  },
  retraining: {
    retrainCount: { type: Number, default: 0 },
    lastReason: { type: String, default: 'Initial model bootstrap' },
    lastStatus: { type: String, enum: ['success', 'failed', 'running'], default: 'success' },
    lastDurationMs: { type: Number, default: 0 },
    lastTriggeredAt: { type: Date },
    lastCompletedAt: { type: Date },
    lastTriggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  collection: 'aiControlStates'
});

module.exports = mongoose.model('AiControlState', aiControlStateSchema);