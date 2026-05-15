/**
 * Notification Model
 * Stores in-app notifications shown in the UI notification panel.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['alert', 'system', 'report', 'security', 'dataset'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'info',
    index: true
  },
  status: {
    type: String,
    enum: ['new', 'read'],
    default: 'new',
    index: true
  },
  icon: {
    type: String,
    default: 'Bell'
  },
  actionUrl: {
    type: String,
    default: ''
  },
  referenceType: {
    type: String,
    default: ''
  },
  referenceId: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'system'
  },
  audience: {
    type: [String],
    default: ['admin']
  },
  readAt: {
    type: Date
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);