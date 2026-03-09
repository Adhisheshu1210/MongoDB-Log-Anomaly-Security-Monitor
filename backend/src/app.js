/**
 * MongoDB Log Anomaly & Security Monitor - Backend API
 * Main Express Application Entry Point
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const logRoutes = require('./routes/logs');
const anomalyRoutes = require('./routes/anomalies');
const alertRoutes = require('./routes/alerts');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');
const settingsManagementRoutes = require('./routes/settingsManagement');
const healthRoutes = require('./routes/health');
const systemRoutes = require('./routes/system');
const usersRoutes = require('./routes/users');
const demoRoutes = require('./routes/demo');

// Import WebSocket handler
const { setupWebSocket } = require('./services/websocket');
const { ensureMinimumDemoData } = require('./services/demoData');

// Import services
const notificationService = require('./services/notification');
const alertService = require('./services/alertService');
const anomalyService = require('./services/anomalyService');
const securityService = require('./services/securityService');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

// Import logger
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/settings-management', settingsManagementRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/demo', demoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MongoDB Log Anomaly & Security Monitor API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Setup WebSocket
setupWebSocket(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_DOCKER 
      : process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI);
    logger.info('MongoDB connected successfully');

    // Initialize default settings after successful connection
    const Settings = require('./models/Settings');
    await Settings.initDefaults();
    logger.info('Default settings initialized');

    // Initialize all services
    await notificationService.initialize();
    await anomalyService.initialize();
    await securityService.initialize();
    logger.info('All services initialized');

    // In development, ensure the dashboard has realistic data without manual seeding.
    if (process.env.NODE_ENV !== 'production' && process.env.AUTO_SEED_DEMO !== 'false') {
      const seedResult = await ensureMinimumDemoData({
        minLogs: 120,
        minAnomalies: 24,
        minAlerts: 12
      });

      if (seedResult.generated) {
        logger.info(
          `Auto-seeded demo data (logs:${seedResult.logsGenerated}, anomalies:${seedResult.anomaliesGenerated}, alerts:${seedResult.alertsGenerated})`
        );
      }
    }
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    // Continue without database for demo purposes
    logger.warn('Running without database connection');
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});

startServer();

module.exports = { app, io };

