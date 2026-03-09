/**
 * Log Model
 * MongoDB log entries storage
 */

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'],
    required: true,
    index: true
  },
  component: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  context: {
    connectionId: Number,
    remote: String,
    pid: Number,
    threadId: String,
    id: Number,
    attr: mongoose.Schema.Types.Mixed,
    duration: Number,
    planSummary: String,
    numYields: Number,
    reslen: Number,
    locks: mongoose.Schema.Types.Mixed,
    protocol: String,
    command: mongoose.Schema.Types.Mixed
  },
  raw: {
    type: String
  },
  classification: {
    type: String,
    enum: ['normal', 'slow_query', 'auth_failure', 'unauthorized_access', 
           'replication_error', 'connection_spike', 'memory_issue', 
           'disk_issue', 'unknown'],
    default: 'unknown',
    index: true
  },
  isAnomaly: {
    type: Boolean,
    default: false,
    index: true
  },
  anomalyScore: {
    type: Number,
    default: 0
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'mongodb'
  }
}, {
  timestamps: true,
  capped: { size: 1073741824, max: 1000000 } // 1GB cap, max 1M documents
});

// Compound indexes for efficient querying
logSchema.index({ timestamp: -1, severity: 1 });
logSchema.index({ timestamp: -1, classification: 1 });
logSchema.index({ isAnomaly: 1, timestamp: -1 });
logSchema.index({ component: 1, timestamp: -1 });

// Text index for full-text search
logSchema.index({ message: 'text', component: 'text' });

module.exports = mongoose.model('Log', logSchema);

