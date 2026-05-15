/**
 * Log Model
 * MongoDB log entries with advanced filtering and anomaly detection
 * - Supports capped collection for automatic oldest log deletion
 * - Full-text search on message and component
 * - Composite indexes for efficient querying
 */

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  // Timestamp of the log entry
  timestamp: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  },

  // Severity level
  severity: {
    type: String,
    enum: ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'],
    required: true,
    index: true
  },

  // Component/service that generated the log
  component: {
    type: String,
    required: true,
    index: true
  },

  // Log message
  message: {
    type: String,
    required: true
  },

  // Additional context/metadata
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

  // Raw log entry if applicable
  raw: {
    type: String
  },

  // Log classification for anomaly detection
  classification: {
    type: String,
    enum: [
      'normal',
      'slow_query',
      'auth_failure',
      'unauthorized_access',
      'replication_error',
      'connection_spike',
      'memory_issue',
      'disk_issue',
      'unknown'
    ],
    default: 'unknown',
    index: true
  },

  // Whether this log represents an anomaly
  isAnomaly: {
    type: Boolean,
    default: false,
    index: true
  },

  // Anomaly score (0-1 scale)
  anomalyScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },

  // When this log was processed/ingested
  processedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Source of the log
  source: {
    type: String,
    default: 'mongodb',
    enum: ['mongodb', 'manual', 'api', 'ingestion', 'webhook']
  }
}, {
  timestamps: true,
  // Capped collection: 1GB cap, max 1M documents
  // Oldest logs are automatically deleted when limit is reached
  capped: { size: 1073741824, max: 1000000 }
});

// === INDEXES ===
// Composite index for timestamp + severity queries
logSchema.index({ timestamp: -1, severity: 1 });

// Composite index for classification queries with timestamp
logSchema.index({ timestamp: -1, classification: 1 });

// Composite index for anomaly detection queries
logSchema.index({ isAnomaly: 1, timestamp: -1 });

// Component-specific queries
logSchema.index({ component: 1, timestamp: -1 });

// Full-text search on message and component
logSchema.index({ message: 'text', component: 'text' });

// Quick lookup for recent logs
logSchema.index({ timestamp: -1 });

// Lookups by source
logSchema.index({ source: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);

