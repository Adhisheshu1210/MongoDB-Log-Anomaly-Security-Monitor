/**
 * Settings Service
 * Handles all system configuration operations
 */

const Settings = require('../models/Settings');
const logger = require('../utils/logger');

class SettingsService {
  /**
   * Get settings by category
   */
  static async getSettingsByCategory(category) {
    try {
      const settings = await Settings.findOne({ category }).lean();
      return settings || null;
    } catch (error) {
      logger.error('Error getting settings by category:', error.message);
      throw error;
    }
  }

  /**
   * Get all settings
   */
  static async getAllSettings(includePrivate = false) {
    try {
      const query = includePrivate ? {} : { isPublic: true };
      const settings = await Settings.find(query).lean();
      return settings;
    } catch (error) {
      logger.error('Error getting all settings:', error.message);
      throw error;
    }
  }

  /**
   * Update setting
   */
  static async updateSetting(key, value, userId, description = null) {
    try {
      const setting = await Settings.findOneAndUpdate(
        { key },
        {
          $set: {
            value,
            updatedBy: userId,
            ...(description && { description })
          }
        },
        { new: true, runValidators: true, upsert: true }
      );
      return setting;
    } catch (error) {
      logger.error('Error updating setting:', error.message);
      throw error;
    }
  }

  /**
   * Get general settings
   */
  static async getGeneralSettings() {
    try {
      const settings = await Settings.findOne({ key: 'generalSettings' }).lean();
      return settings?.value || {
        systemDisplayName: 'Sentinel SIEM Enterprise',
        primaryContactEmail: 'admin@siem.io',
        organizationName: 'Security Operations Center',
        timezone: 'UTC',
        language: 'en',
        environmentType: 'production'
      };
    } catch (error) {
      logger.error('Error getting general settings:', error.message);
      throw error;
    }
  }

  /**
   * Update general settings
   */
  static async updateGeneralSettings(data, userId) {
    try {
      const setting = await Settings.findOneAndUpdate(
        { key: 'generalSettings' },
        {
          $set: {
            value: data,
            category: 'general',
            updatedBy: userId
          }
        },
        { new: true, runValidators: true, upsert: true }
      );
      return setting;
    } catch (error) {
      logger.error('Error updating general settings:', error.message);
      throw error;
    }
  }

  /**
   * Get storage settings
   */
  static async getStorageSettings() {
    try {
      const settings = await Settings.findOne({ key: 'storageSettings' }).lean();
      return settings?.value || {
        hotStorageDays: 30,
        coldStorageDays: 365,
        maxDocuments: 1000000,
        autoArchiveEnabled: true,
        archiveLocation: 'deep-archive-cluster',
        compressionEnabled: true
      };
    } catch (error) {
      logger.error('Error getting storage settings:', error.message);
      throw error;
    }
  }

  /**
   * Update storage settings
   */
  static async updateStorageSettings(data, userId) {
    try {
      const setting = await Settings.findOneAndUpdate(
        { key: 'storageSettings' },
        {
          $set: {
            value: data,
            category: 'processing',
            updatedBy: userId
          }
        },
        { new: true, runValidators: true, upsert: true }
      );
      return setting;
    } catch (error) {
      logger.error('Error updating storage settings:', error.message);
      throw error;
    }
  }

  /**
   * Get API & Webhooks settings
   */
  static async getApiWebhookSettings() {
    try {
      const settings = await Settings.findOne({ key: 'apiWebhookSettings' }).lean();
      return settings?.value || {
        apiKeysEnabled: true,
        rateLimit: '1000',
        webhooksEnabled: true,
        retryAttempts: 3,
        webhookTimeout: 30,
        ipWhitelistEnabled: false,
        ipWhitelist: []
      };
    } catch (error) {
      logger.error('Error getting API/Webhook settings:', error.message);
      throw error;
    }
  }

  /**
   * Update API & Webhooks settings
   */
  static async updateApiWebhookSettings(data, userId) {
    try {
      const setting = await Settings.findOneAndUpdate(
        { key: 'apiWebhookSettings' },
        {
          $set: {
            value: data,
            category: 'processing',
            updatedBy: userId
          }
        },
        { new: true, runValidators: true, upsert: true }
      );
      return setting;
    } catch (error) {
      logger.error('Error updating API/Webhook settings:', error.message);
      throw error;
    }
  }

  /**
   * Generate or rotate API key
   */
  static async generateApiKey(userId) {
    try {
      const key = 'sk_live_' + require('crypto').randomBytes(32).toString('hex');
      const settings = await Settings.findOne({ key: 'apiKeys' });

      if (!settings) {
        const newSettings = new Settings({
          key: 'apiKeys',
          category: 'security',
          value: {
            keys: [{ key, createdAt: new Date(), createdBy: userId, active: true }]
          },
          updatedBy: userId
        });
        await newSettings.save();
        return { key, message: 'API key generated successfully' };
      }

      settings.value.keys.push({ key, createdAt: new Date(), createdBy: userId, active: true });
      await settings.save();
      return { key, message: 'API key generated successfully' };
    } catch (error) {
      logger.error('Error generating API key:', error.message);
      throw error;
    }
  }

  /**
   * Get all API keys (masked)
   */
  static async getApiKeys() {
    try {
      const settings = await Settings.findOne({ key: 'apiKeys' }).lean();
      if (!settings) return [];

      return settings.value.keys.map(k => ({
        keyId: k.key.substring(0, 20) + '...',
        fullKey: k.key,
        createdAt: k.createdAt,
        active: k.active
      }));
    } catch (error) {
      logger.error('Error getting API keys:', error.message);
      throw error;
    }
  }

  /**
   * Deactivate API key
   */
  static async deactivateApiKey(keyId) {
    try {
      const settings = await Settings.findOneAndUpdate(
        { key: 'apiKeys', 'value.keys.key': keyId },
        { $set: { 'value.keys.$.active': false } },
        { new: true }
      );
      return settings;
    } catch (error) {
      logger.error('Error deactivating API key:', error.message);
      throw error;
    }
  }

  /**
   * Validate settings
   */
  static async validateSettings(category, data) {
    const validations = {
      general: {
        systemDisplayName: { required: true, type: 'string', minLength: 1 },
        primaryContactEmail: { required: true, type: 'email' },
        timezone: { required: true, type: 'string' }
      },
      storage: {
        hotStorageDays: { required: true, type: 'number', min: 1, max: 365 },
        coldStorageDays: { required: true, type: 'number', min: 1, max: 3650 },
        autoArchiveEnabled: { required: true, type: 'boolean' }
      },
      apiWebhook: {
        rateLimit: { required: true, type: 'number', min: 1 },
        webhookTimeout: { required: true, type: 'number', min: 5, max: 300 },
        retryAttempts: { required: true, type: 'number', min: 0, max: 10 }
      }
    };

    const rules = validations[category];
    if (!rules) return { valid: true };

    const errors = {};
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.required && !data[field]) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (data[field]) {
        if (rule.type === 'email' && !this.isValidEmail(data[field])) {
          errors[field] = `${field} must be a valid email`;
        }
        if (rule.type === 'number' && typeof data[field] !== 'number') {
          errors[field] = `${field} must be a number`;
        }
        if (rule.min && data[field] < rule.min) {
          errors[field] = `${field} must be at least ${rule.min}`;
        }
        if (rule.max && data[field] > rule.max) {
          errors[field] = `${field} must be no more than ${rule.max}`;
        }
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = SettingsService;
