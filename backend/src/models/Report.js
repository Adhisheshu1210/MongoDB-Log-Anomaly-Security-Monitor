/**
 * Report Model
 * Stores generated system and compliance reports for history and download.
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  reportType: {
    type: String,
    required: true,
    index: true
  },
  format: {
    type: String,
    enum: ['json', 'csv'],
    default: 'json'
  },
  status: {
    type: String,
    enum: ['GENERATING', 'READY', 'FAILED', 'ARCHIVED', 'SCHEDULED'],
    default: 'READY',
    index: true
  },
  dateRange: {
    key: String,
    label: String,
    from: Date,
    to: Date
  },
  summary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  csvContent: {
    type: String,
    default: ''
  },
  fileSizeBytes: {
    type: Number,
    default: 0
  },
  fileName: {
    type: String,
    default: ''
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  scheduledEmail: {
    enabled: {
      type: Boolean,
      default: false
    },
    recipients: {
      type: [String],
      default: []
    },
    cadence: {
      type: String,
      default: 'manual'
    },
    lastSentAt: Date,
    nextRunAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

reportSchema.index({ createdAt: -1, reportType: 1 });
reportSchema.index({ reportId: 1, reportType: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);