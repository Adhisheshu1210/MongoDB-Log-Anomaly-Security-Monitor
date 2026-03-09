/**
 * Settings Routes
 * Handles system configuration and alert threshold settings
 * Includes comprehensive RBAC and error handling
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Settings = require('../models/Settings');
const { generateDemoData } = require('../services/demoData');
const securityService = require('../services/securityService');
const rbacService = require('../services/rbacService');
const logger = require('../utils/logger');

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const settings = await Settings.find({ isPublic: true }).lean();
    
    // Get all settings for admin
    if (req.user.role === 'admin') {
      const allSettings = await Settings.find().lean();
      return res.json({
        success: true,
        data: allSettings
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get settings error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

// @route   POST /api/settings
// @desc    Create new setting
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { key, value, category, description, isPublic } = req.body;

    // Check if setting already exists
    const existing = await Settings.findOne({ key });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Setting with this key already exists'
      });
    }

    const setting = await Settings.create({
      key,
      value,
      category,
      description,
      isPublic,
      updatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: setting
    });
  } catch (error) {
    logger.error('Create setting error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating setting'
    });
  }
});

// @route   POST /api/settings/init
// @desc    Initialize default settings
// @access  Private (Admin)
router.post('/init', protect, authorize('admin'), async (req, res) => {
  try {
    await Settings.initDefaults();
    
    const settings = await Settings.find().lean();

    res.json({
      success: true,
      message: 'Default settings initialized',
      data: settings
    });
  } catch (error) {
    logger.error('Init settings error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error initializing settings'
    });
  }
});

// @route   DELETE /api/settings/:key
// @desc    Delete setting by key
// @access  Private (Admin)
router.delete('/:key', protect, authorize('admin'), async (req, res) => {
  try {
    const setting = await Settings.findOneAndDelete({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      message: 'Setting deleted'
    });
  } catch (error) {
    logger.error('Delete setting error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting setting'
    });
  }
});

// @route   GET /api/settings/backup
// @desc    Export all settings as JSON backup file
// @access  Private (Admin)
router.get('/backup', protect, authorize('admin'), async (req, res) => {
  try {
    // RBAC validation
    if (!rbacService.isActionAllowed(req.user, 'settings:backup')) {
      logger.warn(`Unauthorized backup attempt by ${req.user.username} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: rbacService.getUnauthorizedMessage('settings:backup', req.user.role)
      });
    }

    // Fetch all settings
    const settings = await Settings.find().lean();
    
    if (!settings || settings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No settings found to backup'
      });
    }
    
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      exportedBy: req.user.username,
      totalSettings: settings.length,
      settings: settings.reduce((acc, s) => {
        acc[s.key] = {
          value: s.value,
          category: s.category,
          description: s.description,
          isPublic: s.isPublic
        };
        return acc;
      }, {})
    };

    // Audit log
    await securityService.auditLog('backup', req.user._id, 'settings', { count: settings.length });

    res.json({
      success: true,
      message: `Settings backup created with ${settings.length} items`,
      data: backup
    });
  } catch (error) {
    logger.error('Backup settings error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to backup settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/settings/restore
// @desc    Restore settings from a backup JSON file
// @access  Private (Admin)
router.post('/restore', protect, authorize('admin'), async (req, res) => {
  try {
    // RBAC validation
    if (!rbacService.isActionAllowed(req.user, 'settings:restore')) {
      logger.warn(`Unauthorized restore attempt by ${req.user.username} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: rbacService.getUnauthorizedMessage('settings:restore', req.user.role)
      });
    }

    const { backup } = req.body;
    
    // Validate backup structure
    if (!backup) {
      return res.status(400).json({
        success: false,
        message: 'No backup data provided. Please provide a valid backup JSON object.',
        details: 'Expected format: { version, timestamp, settings: {...} }'
      });
    }
    
    if (!backup.settings || typeof backup.settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup file format',
        details: 'Backup must contain a settings object with key-value pairs',
        providedFields: Object.keys(backup || {})
      });
    }

    // Validate backup version compatibility
    if (backup.version && !backup.version.startsWith('1.')) {
      logger.warn(`Backup version mismatch: ${backup.version}`);
      return res.status(400).json({
        success: false,
        message: `Incompatible backup version: ${backup.version}. This system requires version 1.x`,
        details: 'The backup file may be from a different version of the system.'
      });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    // Validate settings entries
    const settingEntries = Object.entries(backup.settings || {});
    if (settingEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Backup contains no settings to restore',
        details: 'The backup file has an empty settings object'
      });
    }

    // Restore settings one by one
    for (const [key, setting] of settingEntries) {
      try {
        // Validate setting object
        if (!setting || typeof setting !== 'object') {
          results.errors.push({ 
            key, 
            error: 'Invalid setting format - must be an object' 
          });
          results.failed++;
          continue;
        }

        const existing = await Settings.findOne({ key });
        
        if (existing) {
          try {
            await Settings.findOneAndUpdate(
              { key },
              { 
                value: setting.value,
                category: setting.category || existing.category || 'general',
                description: setting.description || existing.description,
                isPublic: setting.isPublic !== undefined ? setting.isPublic : true,
                updatedBy: req.user._id
              },
              { new: true }
            );
            results.updated++;
          } catch (updateErr) {
            results.errors.push({ key, error: `Update failed: ${updateErr.message}` });
            results.failed++;
          }
        } else {
          try {
            await Settings.create({
              key,
              value: setting.value,
              category: setting.category || 'general',
              description: setting.description || '',
              isPublic: setting.isPublic !== undefined ? setting.isPublic : true,
              updatedBy: req.user._id
            });
            results.created++;
          } catch (createErr) {
            results.errors.push({ key, error: `Creation failed: ${createErr.message}` });
            results.failed++;
          }
        }
      } catch (err) {
        results.errors.push({ 
          key, 
          error: `Unexpected error: ${err.message}` 
        });
        results.failed++;
      }
    }

    // Check overall success
    if (results.failed === settingEntries.length) {
      await securityService.auditLog('restore', req.user._id, 'settings', { status: 'failed', errors: results.errors });
      return res.status(400).json({
        success: false,
        message: 'Failed to restore settings - all entries had errors',
        results
      });
    }

    const settings = await Settings.find().lean();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('settings:restored', settings);
    }

    // Audit log
    await securityService.auditLog('restore', req.user._id, 'settings', { 
      updated: results.updated,
      failed: results.failed 
    });

    res.json({
      success: true,
      message: `Settings restored successfully: ${results.created} created, ${results.updated} updated${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
      results,
      data: settings
    });
  } catch (error) {
    logger.error('Restore settings error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore settings - server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/settings/demo
// @desc    Generate demo data (logs, anomalies, alerts) for testing
// @access  Private (Admin)
router.post('/demo', protect, authorize('admin'), async (req, res) => {
  try {
    // RBAC validation
    if (!rbacService.isActionAllowed(req.user, 'demo:generate')) {
      logger.warn(`Unauthorized demo generation attempt by ${req.user.username} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: rbacService.getUnauthorizedMessage('demo:generate', req.user.role)
      });
    }

    const { 
      logsCount = 120,
      anomaliesCount = 24,
      alertsCount = 12
    } = req.body;

    // Validate input parameters
    if (logsCount && (logsCount < 1 || logsCount > 10000)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid logsCount parameter',
        details: 'logsCount must be between 1 and 10000'
      });
    }
    if (anomaliesCount && (anomaliesCount < 1 || anomaliesCount > 5000)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid anomaliesCount parameter',
        details: 'anomaliesCount must be between 1 and 5000'
      });
    }
    if (alertsCount && (alertsCount < 1 || alertsCount > 5000)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alertsCount parameter',
        details: 'alertsCount must be between 1 and 5000'
      });
    }

    try {
      const result = await generateDemoData({ logsCount, anomaliesCount, alertsCount });

      if (!result) {
        throw new Error('Demo data generation returned no result');
      }

      // Audit log
      await securityService.auditLog('generate_demo', req.user._id, 'demo_data', { 
        logs: result.logsGenerated, 
        anomalies: result.anomaliesGenerated,
        alerts: result.alertsGenerated
      });

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.emit('demo:generated', {
          timestamp: new Date(),
          data: result
        });
      }

      res.json({
        success: true,
        message: `Demo data generated successfully: ${result.logsGenerated} logs, ${result.anomaliesGenerated} anomalies, ${result.alertsGenerated} alerts`,
        data: result
      });
    } catch (genError) {
      logger.error('Demo generation failed:', genError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate demo data',
        details: genError.message,
        error: process.env.NODE_ENV === 'development' ? genError.message : undefined
      });
    }
  } catch (error) {
    logger.error('Demo endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing demo data request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/settings/clear-demo
// @desc    Clear all demo-generated data (logs, anomalies, alerts)
// @access  Private (Admin)
router.post('/clear-demo', protect, authorize('admin'), async (req, res) => {
  try {
    // RBAC validation
    if (!rbacService.isActionAllowed(req.user, 'demo:clear')) {
      logger.warn(`Unauthorized demo clear attempt by ${req.user.username} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: rbacService.getUnauthorizedMessage('demo:clear', req.user.role)
      });
    }

    const Log = require('../models/Log');
    const Anomaly = require('../models/Anomaly');
    const Alert = require('../models/Alert');

    try {
      // Delete demo data with error handling
      const [logResult, anomalyResult, alertResult] = await Promise.all([
        Log.deleteMany({ source: 'demo' }).catch(err => {
          logger.error('Failed to delete demo logs:', err.message);
          throw new Error(`Failed to delete demo logs: ${err.message}`);
        }),
        Anomaly.deleteMany({ source: 'demo' }).catch(err => {
          logger.error('Failed to delete demo anomalies:', err.message);
          throw new Error(`Failed to delete demo anomalies: ${err.message}`);
        }),
        Alert.deleteMany({ source: 'demo' }).catch(err => {
          logger.error('Failed to delete demo alerts:', err.message);
          throw new Error(`Failed to delete demo alerts: ${err.message}`);
        })
      ]);

      const totalDeleted = logResult.deletedCount + anomalyResult.deletedCount + alertResult.deletedCount;

      if (totalDeleted === 0) {
        logger.info('No demo data found to clear');
        return res.json({
          success: true,
          message: 'No demo data found to clear',
          data: {
            logsDeleted: 0,
            anomaliesDeleted: 0,
            alertsDeleted: 0,
            totalDeleted: 0
          }
        });
      }

      // Audit log
      await securityService.auditLog('clear_demo', req.user._id, 'demo_data', { 
        logs: logResult.deletedCount, 
        anomalies: anomalyResult.deletedCount,
        alerts: alertResult.deletedCount
      });

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.emit('demo:cleared', {
          timestamp: new Date(),
          counts: {
            logsDeleted: logResult.deletedCount,
            anomaliesDeleted: anomalyResult.deletedCount,
            alertsDeleted: alertResult.deletedCount
          }
        });
      }

      res.json({
        success: true,
        message: `Demo data cleared successfully: ${logResult.deletedCount} logs, ${anomalyResult.deletedCount} anomalies, ${alertResult.deletedCount} alerts deleted`,
        data: {
          logsDeleted: logResult.deletedCount,
          anomaliesDeleted: anomalyResult.deletedCount,
          alertsDeleted: alertResult.deletedCount,
          totalDeleted
        }
      });
    } catch (deleteError) {
      logger.error('Demo data deletion failed:', deleteError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear demo data',
        details: deleteError.message,
        error: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
      });
    }
  } catch (error) {
    logger.error('Clear demo endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while clearing demo data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/settings/:key
// @desc    Get setting by key
// @access  Private
router.get('/:key', protect, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key }).lean();

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    // Check if user has permission to view this setting
    if (!setting.isPublic && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this setting'
      });
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    logger.error('Get setting error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching setting'
    });
  }
});

// @route   PUT /api/settings/:key
// @desc    Update setting by key (creates if not exists)
// @access  Private
router.put('/:key', protect, async (req, res) => {
  try {
    const { value, description } = req.body;

    // Handle both formats: { value: {...} } and { value: {...}, description: "..." }
    const updateValue = value !== undefined ? value : req.body;
    const updateDescription = description !== undefined ? description : req.body.description;

    // Use upsert: true to create if doesn't exist
    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      {
        $set: {
          value: updateValue,
          description: updateDescription || '',
          updatedBy: req.user._id
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('settings:updated', setting);
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    logger.error('Update setting error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating setting'
    });
  }
});

module.exports = router;

