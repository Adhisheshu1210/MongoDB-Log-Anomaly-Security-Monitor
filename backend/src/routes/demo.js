/**
 * Demo Data Routes
 * Handles generation and clearing of demo data for testing the dashboard
 * Endpoints: POST /api/demo/generate, DELETE /api/demo/clear
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { generateDemoData } = require('../services/demoData');
const securityService = require('../services/securityService');
const rbacService = require('../services/rbacService');
const logger = require('../utils/logger');

// Import models for clearing demo data
const Log = require('../models/Log');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');

/**
 * Helper function to validate demo data generation parameters
 */
const validateDemoParams = (logsCount, anomaliesCount, alertsCount) => {
  const errors = [];
  
  if (logsCount !== undefined && (logsCount < 1 || logsCount > 10000)) {
    errors.push('logsCount must be between 1 and 10000');
  }
  if (anomaliesCount !== undefined && (anomaliesCount < 1 || anomaliesCount > 5000)) {
    errors.push('anomaliesCount must be between 1 and 5000');
  }
  if (alertsCount !== undefined && (alertsCount < 1 || alertsCount > 5000)) {
    errors.push('alertsCount must be between 1 and 5000');
  }
  
  return errors;
};

/**
 * @route   POST /api/demo/generate
 * @desc    Generate sample demo data for testing the dashboard
 * @access  Private (Admin only)
 * 
 * Generates:
 * - 100 sample logs (default) with demo:true flag
 * - Sample anomalies from the generated logs
 * - Sample alerts with demo:true flag
 */
router.post('/generate', protect, authorize('admin'), async (req, res) => {
  try {
    // RBAC validation
    if (!rbacService.isActionAllowed(req.user, 'demo:generate')) {
      logger.warn(`Unauthorized demo generation attempt by ${req.user.username} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: rbacService.getUnauthorizedMessage('demo:generate', req.user.role)
      });
    }

    // Extract parameters with defaults
    const { 
      logsCount = 100,
      anomaliesCount = 20,
      alertsCount = 10
    } = req.body;

    // Validate input parameters
    const validationErrors = validateDemoParams(logsCount, anomaliesCount, alertsCount);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validationErrors
      });
    }

    logger.info(`Demo data generation started by ${req.user.username}`);

    // Generate demo data
    const result = await generateDemoData({ 
      logsCount, 
      anomaliesCount, 
      alertsCount 
    });

    if (!result) {
      throw new Error('Demo data generation returned no result');
    }

    // Audit log
    await securityService.auditLog('generate_demo', req.user._id, 'demo_data', { 
      logs: result.logsGenerated, 
      anomalies: result.anomaliesGenerated,
      alerts: result.alertsGenerated
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('demo:generated', {
        timestamp: new Date(),
        data: result
      });
    }

    logger.info(`Demo data generated successfully: ${result.logsGenerated} logs, ${result.anomaliesGenerated} anomalies, ${result.alertsGenerated} alerts`);

    res.status(201).json({
      success: true,
      message: `Demo data generated successfully: ${result.logsGenerated} logs, ${result.anomaliesGenerated} anomalies, ${result.alertsGenerated} alerts`,
      data: result
    });
  } catch (error) {
    logger.error('Demo generation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate demo data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/demo/clear
 * @desc    Remove all demo-generated data from logs, anomalies, and alerts collections
 * @access  Private (Admin only)
 * 
 * Removes all documents where demo: true
 */
router.delete('/clear', protect, authorize('admin'), async (req, res) => {
  try {
    // RBAC validation
    if (!rbacService.isActionAllowed(req.user, 'demo:clear')) {
      logger.warn(`Unauthorized demo clear attempt by ${req.user.username} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: rbacService.getUnauthorizedMessage('demo:clear', req.user.role)
      });
    }

    logger.info(`Demo data clearing started by ${req.user.username}`);

    // Delete demo data with error handling
    const [logResult, anomalyResult, alertResult] = await Promise.all([
      Log.deleteMany({ demo: true }).catch(err => {
        logger.error('Failed to delete demo logs:', err.message);
        throw new Error(`Failed to delete demo logs: ${err.message}`);
      }),
      Anomaly.deleteMany({ demo: true }).catch(err => {
        logger.error('Failed to delete demo anomalies:', err.message);
        throw new Error(`Failed to delete demo anomalies: ${err.message}`);
      }),
      Alert.deleteMany({ demo: true }).catch(err => {
        logger.error('Failed to delete demo alerts:', err.message);
        throw new Error(`Failed to delete demo alerts: ${err.message}`);
      })
    ]);

    const totalDeleted = logResult.deletedCount + anomalyResult.deletedCount + alertResult.deletedCount;

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

    logger.info(`Demo data cleared successfully: ${logResult.deletedCount} logs, ${anomalyResult.deletedCount} anomalies, ${alertResult.deletedCount} alerts`);

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
  } catch (error) {
    logger.error('Demo clear error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear demo data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

