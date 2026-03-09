/**
 * System Routes
 * Provides system metrics and monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const { protect, authorize } = require('../middleware/auth');
const Log = require('../models/Log');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// @route   GET /api/system/metrics
// @desc    Get real-time system metrics
// @access  Private
router.get('/metrics', protect, async (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get CPU usage
    let cpuUsage = 0;
    cpus.forEach(cpu => {
      const total = Object.values(cpu.times).reduce((acc, t) => acc + t, 0);
      const idle = cpu.times.idle;
      cpuUsage += ((total - idle) / total) * 100;
    });
    cpuUsage = cpuUsage / cpus.length;

    // Get memory usage percentage
    const memUsagePercent = (usedMem / totalMem) * 100;

    // Get load averages (only available on Unix)
    const loadAvg = os.loadavg ? os.loadavg() : [0, 0, 0];

    // Get network interfaces
    const networkInterfaces = os.networkInterfaces();
    const addresses = Object.keys(networkInterfaces).map(name => {
      const iface = networkInterfaces[name].filter(info => info.family === 'IPv4');
      return { name, addresses: iface.map(i => i.address) };
    });

    // Get recent activity counts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [
      logsLastHour,
      anomaliesLastHour,
      alertsLastHour,
      activeAlerts
    ] = await Promise.all([
      Log.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      Anomaly.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      Alert.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      Alert.countDocuments({ status: { $ne: 'resolved' } })
    ]);

    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: process.uptime(),
        hostname: os.hostname()
      },
      cpu: {
        count: cpus.length,
        usage: Math.round(cpuUsage * 100) / 100,
        loadAverage: loadAvg.map(l => Math.round(l * 100) / 100)
      },
      memory: {
        total: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100, // GB
        used: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100, // GB
        free: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100, // GB
        usagePercent: Math.round(memUsagePercent * 100) / 100
      },
      network: addresses,
      activity: {
        logsLastHour,
        anomaliesLastHour,
        alertsLastHour,
        activeAlerts
      },
      process: {
        pid: process.pid,
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) // MB
        }
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get system metrics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching system metrics'
    });
  }
});

// @route   GET /api/system/health
// @desc    Get detailed system health status
// @access  Private
router.get('/health', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

    // Check MongoDB connection
    const mongodbState = mongoose.connection.readyState;
    const mongodbStatus = mongodbState === 1 ? 'connected' : 
                          mongodbState === 2 ? 'connecting' : 'disconnected';

    // Get database stats
    let dbStats = null;
    if (mongodbState === 1) {
      try {
        dbStats = await mongoose.connection.db.stats();
      } catch (e) {
        dbStats = { error: e.message };
      }
    }

    const health = {
      status: mongodbStatus === 'connected' && memUsagePercent < 90 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: mongodbStatus === 'connected' ? 'ok' : 'error',
          connection: mongodbStatus,
          stats: dbStats
        },
        memory: {
          status: memUsagePercent < 90 ? 'ok' : 'warning',
          usagePercent: Math.round(memUsagePercent * 100) / 100
        },
        uptime: {
          status: 'ok',
          seconds: process.uptime()
        }
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Get system health error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching system health'
    });
  }
});

// @route   GET /api/system/info
// @desc    Get system information
// @access  Public
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'MongoDB Log Anomaly & Security Monitor',
      version: '1.0.0',
      description: 'Real-time MongoDB log monitoring and anomaly detection system',
      endpoints: {
        auth: '/api/auth',
        logs: '/api/logs',
        anomalies: '/api/anomalies',
        alerts: '/api/alerts',
        stats: '/api/stats',
        settings: '/api/settings',
        health: '/api/health',
        system: '/api/system'
      },
      features: [
        'Real-time log monitoring',
        'Anomaly detection with ML',
        'Alert management',
        'Notification integrations',
        'WebSocket real-time updates',
        'Demo data generation'
      ]
    }
  });
});

module.exports = router;

