/**
 * Health Routes
 * System health check endpoints
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// @route   GET /api/health
// @desc    Get system health status
// @access  Public
router.get('/', async (req, res) => {
  try {
    const start = Date.now();
    
    // Check MongoDB connection
    let mongodbStatus = 'disconnected';
    const mongodbState = mongoose.connection.readyState;
    if (mongodbState === 1) mongodbStatus = 'connected';
    else if (mongodbState === 2) mongodbStatus = 'connecting';
    else if (mongodbState === 3) mongodbStatus = 'disconnecting';

    const responseTime = Date.now() - start;

    const health = {
      status: mongodbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: {
          status: mongodbStatus,
          readyState: mongodbState
        },
        api: {
          status: 'running',
          responseTime: `${responseTime}ms`
        }
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    res.status(mongodbStatus === 'connected' ? 200 : 503).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health check error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error checking system health'
    });
  }
});

// @route   GET /api/health/ready
// @desc    Kubernetes readiness probe
// @access  Public
router.get('/ready', async (req, res) => {
  try {
    const mongodbState = mongoose.connection.readyState;
    
    if (mongodbState === 1) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/health/live
// @desc    Kubernetes liveness probe
// @access  Public
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

