/**
 * AI Activity Model
 * Stores retraining and inference activity for the AI controls panel.
 */

const mongoose = require('mongoose');

const aiActivitySchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['INFERENCE', 'RETRAIN_START', 'RETRAIN_COMPLETE', 'SETTING_UPDATE'],
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'RUNNING', 'SKIPPED', 'FAILED'],
    default: 'SUCCESS',
    index: true
  },
  durationMs: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modelName: {
    type: String,
    default: 'Sentinel-NLP-v4'
  },
  source: {
    type: String,
    default: 'ai-controls',
    index: true
  }
}, {
  timestamps: true,
  collection: 'aiActivities'
});

aiActivitySchema.index({ createdAt: -1, eventType: 1 });
aiActivitySchema.index({ source: 1, createdAt: -1 });

module.exports = mongoose.model('AiActivity', aiActivitySchema);