/**
 * SIEM Dataset Record Model
 * Stores raw Hugging Face dataset rows with normalized fields for filtering.
 */

const mongoose = require('mongoose');

const siemDatasetRecordSchema = new mongoose.Schema({
  dataset: {
    type: String,
    required: true,
    index: true
  },
  config: {
    type: String,
    required: true,
    default: 'default',
    index: true
  },
  split: {
    type: String,
    required: true,
    index: true
  },
  rowIdx: {
    type: Number,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    index: true
  },
  severity: {
    type: String,
    index: true
  },
  source: {
    type: String,
    index: true
  },
  classification: {
    type: String,
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
  // Stores the row exactly as received from Hugging Face.
  rawRecord: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

siemDatasetRecordSchema.index(
  { dataset: 1, config: 1, split: 1, rowIdx: 1 },
  { unique: true }
);

siemDatasetRecordSchema.index({ dataset: 1, timestamp: -1 });
siemDatasetRecordSchema.index({ dataset: 1, severity: 1, classification: 1 });

module.exports = mongoose.model('SiemDatasetRecord', siemDatasetRecordSchema);
