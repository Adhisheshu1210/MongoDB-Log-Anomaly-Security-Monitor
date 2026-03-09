/**
 * Settings Model
 * Stores system configuration and alert thresholds
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'alert', 'notification', 'processing', 'display', 'security'],
    default: 'general'
  },
  description: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Default settings initializer
settingsSchema.statics.initDefaults = async function() {
  const defaultSettings = [
    {
      key: 'alertThresholds',
      category: 'alert',
      value: {
        slowQueryMs: 100,
        connectionSpikeThreshold: 100,
        errorRateThreshold: 10,
        memoryUsagePercent: 85,
        diskUsagePercent: 90,
        replicationLagSeconds: 10
      },
      description: 'Threshold values for triggering alerts'
    },
    {
      key: 'notificationSettings',
      category: 'notification',
      value: {
        email: {
          enabled: false,
          recipients: [],
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPass: ''
        },
        slack: {
          enabled: false,
          webhookUrl: ''
        },
        telegram: {
          enabled: false,
          botToken: '',
          chatId: ''
        }
      },
      description: 'Notification channel configurations'
    },
    {
      key: 'anomalyDetection',
      category: 'processing',
      value: {
        enabled: true,
        algorithm: 'isolation_forest',
        contamination: 0.1,
        n_estimators: 100,
        modelUpdateInterval: 3600
      },
      description: 'Anomaly detection algorithm settings'
    },
    {
      key: 'logRetention',
      category: 'processing',
      value: {
        days: 30,
        maxDocuments: 1000000
      },
      description: 'Log retention policy'
    },
    {
      key: 'displaySettings',
      category: 'display',
      value: {
        refreshInterval: 5000,
        logsPerPage: 50,
        defaultSeverityFilter: ['ERROR', 'WARNING'],
        theme: 'dark'
      },
      description: 'Dashboard display preferences'
    },
    {
      key: 'security',
      category: 'security',
      value: {
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireMFA: false
      },
      description: 'Security and authentication settings'
    }
  ];

  for (const setting of defaultSettings) {
    await this.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Settings', settingsSchema);

