/**
 * Database Seeder
 * Seeds the database with sample data for demonstration
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('./src/models/User');
const Log = require('./src/models/Log');
const Anomaly = require('./src/models/Anomaly');
const Alert = require('./src/models/Alert');
const Settings = require('./src/models/Settings');

const logger = require('./src/utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/log_monitor';

// Sample data
const sampleLogs = [
  { timestamp: new Date(Date.now() - 3600000), severity: 'INFO', component: 'NETWORK', message: 'waiting for connections on port 27017', classification: 'normal' },
  { timestamp: new Date(Date.now() - 3500000), severity: 'INFO', component: 'ACCESS', message: 'Authentication succeeded for user admin@admin from 127.0.0.1', classification: 'normal' },
  { timestamp: new Date(Date.now() - 3400000), severity: 'WARNING', component: 'QUERY', message: 'Slow query: find { status: "active" } took 3456ms', classification: 'slow_query', isAnomaly: true, anomalyScore: 0.8 },
  { timestamp: new Date(Date.now() - 3300000), severity: 'ERROR', component: 'ACCESS', message: 'Authentication failed for user root from 192.168.1.100', classification: 'auth_failure', isAnomaly: true, anomalyScore: 0.9 },
  { timestamp: new Date(Date.now() - 3200000), severity: 'ERROR', component: 'STORAGE', message: 'WiredTiger error: checkpoint failed - no space left', classification: 'disk_issue', isAnomaly: true, anomalyScore: 0.95 },
  { timestamp: new Date(Date.now() - 3100000), severity: 'ERROR', component: 'ACCESS', message: 'Unauthorized: not authorized on admin to execute command', classification: 'unauthorized_access', isAnomaly: true, anomalyScore: 0.85 },
  { timestamp: new Date(Date.now() - 3000000), severity: 'WARNING', component: 'NETWORK', message: 'Connection spike detected: 150 connections', classification: 'connection_spike', isAnomaly: true, anomalyScore: 0.75 },
  { timestamp: new Date(Date.now() - 2900000), severity: 'ERROR', component: 'REPL', message: 'Replication error: sync source connection refused', classification: 'replication_error', isAnomaly: true, anomalyScore: 0.88 },
  { timestamp: new Date(Date.now() - 2800000), severity: 'ERROR', component: 'STORAGE', message: 'Out of memory: cannot allocate 2GB', classification: 'memory_issue', isAnomaly: true, anomalyScore: 0.92 },
  { timestamp: new Date(Date.now() - 2700000), severity: 'INFO', component: 'COMMAND', message: 'command: insert { insert: "logs", documents: 1000 } duration: 45ms', classification: 'normal' },
  { timestamp: new Date(Date.now() - 2600000), severity: 'INFO', component: 'QUERY', message: 'query test.orders planSummary: IXSCAN { userId: 1 } docsExamined: 500 docsReturned: 10 duration: 45ms', classification: 'normal' },
  { timestamp: new Date(Date.now() - 2500000), severity: 'WARNING', component: 'STORAGE', message: 'Disk space warning: 90% used', classification: 'disk_issue', isAnomaly: true, anomalyScore: 0.7 },
  { timestamp: new Date(Date.now() - 2400000), severity: 'ERROR', component: 'ACCESS', message: 'Password verification failed for user developer', classification: 'auth_failure', isAnomaly: true, anomalyScore: 0.65 },
  { timestamp: new Date(Date.now() - 2300000), severity: 'INFO', component: 'WRITE', message: 'update test.products updated: 50 documents in 234ms', classification: 'normal' },
  { timestamp: new Date(Date.now() - 2200000), severity: 'ERROR', component: 'REPL', message: 'Secondary lagging behind primary by 30s', classification: 'replication_error', isAnomaly: true, anomalyScore: 0.72 },
  { timestamp: new Date(Date.now() - 2100000), severity: 'INFO', component: 'INDEX', message: 'building index test.users on field email { unique: true }', classification: 'normal' },
  { timestamp: new Date(Date.now() - 2000000), severity: 'WARNING', component: 'QUERY', message: 'Collection scan for large dataset: test.logs', classification: 'slow_query', isAnomaly: true, anomalyScore: 0.55 },
  { timestamp: new Date(Date.now() - 1900000), severity: 'ERROR', component: 'NETWORK', message: 'SocketException: couldn\'t connect to server 192.168.1.100:27017', classification: 'connection_spike', isAnomaly: true, anomalyScore: 0.68 },
  { timestamp: new Date(Date.now() - 1800000), severity: 'INFO', component: 'FTDC', message: 'Collected 100 samples in 5s', classification: 'normal' },
  { timestamp: new Date(Date.now() - 1700000), severity: 'ERROR', component: 'COMMAND', message: 'Command failed: not master', classification: 'replication_error', isAnomaly: true, anomalyScore: 0.78 },
  { timestamp: new Date(Date.now() - 1600000), severity: 'WARNING', component: 'ACCESS', message: 'Insufficient permission for operation: drop collection', classification: 'unauthorized_access', isAnomaly: true, anomalyScore: 0.62 },
  { timestamp: new Date(Date.now() - 1500000), severity: 'INFO', component: 'COMMAND', message: 'command: aggregate { aggregate: "orders", pipeline: [] } duration: 567ms', classification: 'normal' },
  { timestamp: new Date(Date.now() - 1400000), severity: 'WARNING', component: 'STORAGE', message: 'CheckPoint delayed: still processing 500 operations', classification: 'slow_query', isAnomaly: true, anomalyScore: 0.58 },
  { timestamp: new Date(Date.now() - 1300000), severity: 'ERROR', component: 'QUERY', message: 'PlanExecutor error during query execution', classification: 'performance', isAnomaly: true, anomalyScore: 0.71 },
  { timestamp: new Date(Date.now() - 1200000), severity: 'INFO', component: 'REPL', message: 'Replica set primary: mongo-primary:27017', classification: 'normal' },
  { timestamp: new Date(Date.now() - 1100000), severity: 'INFO', component: 'NETWORK', message: 'new client connection from 192.168.1.50:54321', classification: 'normal' },
  { timestamp: new Date(Date.now() - 1000000), severity: 'ERROR', component: 'ACCESS', message: 'Authentication failed for user test@admin from 10.0.0.50', classification: 'auth_failure', isAnomaly: true, anomalyScore: 0.82 },
  { timestamp: new Date(Date.now() - 900000), severity: 'WARNING', component: 'NETWORK', message: 'Too many open connections: 500 (max: 500)', classification: 'connection_spike', isAnomaly: true, anomalyScore: 0.85 },
  { timestamp: new Date(Date.now() - 800000), severity: 'INFO', component: 'WRITE', message: 'bulk operation completed: 1000 writes in 890ms', classification: 'normal' },
  { timestamp: new Date(Date.now() - 700000), severity: 'ERROR', component: 'STORAGE', message: 'Cannot create temporary file: no space left on device', classification: 'disk_issue', isAnomaly: true, anomalyScore: 0.98 },
];

const sampleAnomalies = [
  {
    timestamp: new Date(Date.now() - 3000000),
    severity: 'high',
    type: 'performance',
    title: 'Slow Query Detected',
    description: 'Query took 3456ms to complete, exceeding threshold of 100ms',
    details: { queryDuration: 3456, component: 'QUERY' },
    anomalyScore: 0.8,
    algorithm: 'isolation_forest',
    confidence: 0.85,
    recommendedAction: 'Review query execution plan and add appropriate indexes'
  },
  {
    timestamp: new Date(Date.now() - 2800000),
    severity: 'critical',
    type: 'security',
    title: 'Authentication Failure Detected',
    description: 'Multiple authentication failures for user root from IP 192.168.1.100',
    details: { affectedUsers: ['root'], ipAddress: '192.168.1.100' },
    anomalyScore: 0.9,
    algorithm: 'rule_based',
    confidence: 0.92,
    recommendedAction: 'Investigate the source IP and consider blocking repeated failures'
  },
  {
    timestamp: new Date(Date.now() - 2600000),
    severity: 'critical',
    type: 'capacity',
    title: 'Disk Space Critical',
    description: 'WiredTiger error: checkpoint failed due to no space left on device',
    details: { diskUsagePercent: 95 },
    anomalyScore: 0.95,
    algorithm: 'rule_based',
    confidence: 0.98,
    recommendedAction: 'Free up disk space or expand storage immediately'
  },
  {
    timestamp: new Date(Date.now() - 2400000),
    severity: 'high',
    type: 'security',
    title: 'Unauthorized Access Attempt',
    description: 'User attempted to execute admin command without authorization',
    details: { command: 'replSetGetStatus' },
    anomalyScore: 0.85,
    algorithm: 'isolation_forest',
    confidence: 0.88,
    recommendedAction: 'Review user permissions and audit access patterns'
  },
  {
    timestamp: new Date(Date.now() - 2000000),
    severity: 'high',
    type: 'connection',
    title: 'Connection Spike Detected',
    description: '150 concurrent connections detected, exceeding normal threshold',
    details: { connectionCount: 150, threshold: 100 },
    anomalyScore: 0.75,
    algorithm: 'lof',
    confidence: 0.78,
    recommendedAction: 'Review connection pooling settings and consider scaling'
  },
  {
    timestamp: new Date(Date.now() - 1800000),
    severity: 'high',
    type: 'replication',
    title: 'Replication Error',
    description: 'Replication sync source error: connection refused',
    details: { errorCode: 'CONN_REFUSED' },
    anomalyScore: 0.88,
    algorithm: 'rule_based',
    confidence: 0.9,
    recommendedAction: 'Check replica set configuration and network connectivity'
  },
  {
    timestamp: new Date(Date.now() - 1600000),
    severity: 'critical',
    type: 'resource',
    title: 'Out of Memory',
    description: 'System cannot allocate 2GB of memory',
    details: { memoryRequested: '2GB' },
    anomalyScore: 0.92,
    algorithm: 'rule_based',
    confidence: 0.95,
    recommendedAction: 'Check available RAM and consider adding memory or optimizing queries'
  },
  {
    timestamp: new Date(Date.now() - 1200000),
    severity: 'medium',
    type: 'replication',
    title: 'Replication Lag',
    description: 'Secondary replica is lagging behind primary by 30 seconds',
    details: { replicationLagSeconds: 30 },
    anomalyScore: 0.72,
    algorithm: 'lof',
    confidence: 0.75,
    recommendedAction: 'Check network latency and secondary performance'
  },
];

const sampleAlerts = [
  {
    title: 'Critical: Out of Memory',
    message: 'System cannot allocate 2GB of memory. Immediate action required.',
    severity: 'critical',
    category: 'resource',
    source: 'anomaly',
    status: 'new'
  },
  {
    title: 'High: Disk Space Critical',
    message: 'WiredTiger error: checkpoint failed. Disk usage at 95%.',
    severity: 'high',
    category: 'capacity',
    source: 'anomaly',
    status: 'acknowledged'
  },
  {
    title: 'High: Authentication Failures',
    message: 'Multiple authentication failures detected for user root from 192.168.1.100',
    severity: 'high',
    category: 'security',
    source: 'anomaly',
    status: 'investigating'
  },
  {
    title: 'Medium: Connection Spike',
    message: '150 concurrent connections detected, exceeding threshold of 100',
    severity: 'medium',
    category: 'connection',
    source: 'anomaly',
    status: 'resolved'
  },
  {
    title: 'Medium: Slow Query',
    message: 'Query took 3456ms to complete',
    severity: 'medium',
    category: 'performance',
    source: 'anomaly',
    status: 'new'
  },
  {
    title: 'High: Replication Error',
    message: 'Replication sync failed: connection refused',
    severity: 'high',
    category: 'replication',
    source: 'anomaly',
    status: 'new'
  },
];

async function seed() {
  try {
    logger.info('Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Log.deleteMany({});
    await Anomaly.deleteMany({});
    await Alert.deleteMany({});
    await Settings.deleteMany({});
    logger.info('Cleared existing data');
    
    // Create default settings
    await Settings.initDefaults();
    logger.info('Initialized default settings');
    
    // Create demo users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const users = await User.create([
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user'
      },
      {
        username: 'viewer',
        email: 'viewer@example.com',
        password: hashedPassword,
        role: 'viewer'
      }
    ]);
    logger.info(`Created ${users.length} demo users`);
    
    // Create sample logs
    const logs = await Log.insertMany(sampleLogs);
    logger.info(`Created ${logs.length} sample logs`);
    
    // Create sample anomalies
    const anomalies = await Anomaly.insertMany(sampleAnomalies);
    logger.info(`Created ${anomalies.length} sample anomalies`);
    
    // Create sample alerts
    const alerts = await Alert.insertMany(sampleAlerts);
    logger.info(`Created ${alerts.length} sample alerts`);
    
    logger.info('✅ Database seeding completed successfully!');
    logger.info('Demo credentials:');
    logger.info('  Admin: admin@example.com / admin123');
    logger.info('  User: user@example.com / admin123');
    logger.info('  Viewer: viewer@example.com / admin123');
    
    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;

