/**
 * Seed sample SIEM dataset records into MongoDB.
 * Useful for testing when Hugging Face import has issues.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SiemDatasetRecord = require('../models/SiemDatasetRecord');
const logger = require('../utils/logger');

const SAMPLE_RECORDS = [
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 1,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    severity: 'HIGH',
    source: 'auth_service',
    classification: 'unauthorized_access',
    isAnomaly: true,
    anomalyScore: 0.92,
    rawRecord: {
      event_id: 'EVT-001',
      timestamp: '2024-01-15T10:30:00Z',
      severity: 'HIGH',
      source: 'auth_service',
      message: 'Multiple failed login attempts detected',
      user: 'admin',
      ip_address: '192.168.1.100',
      classification: 'unauthorized_access'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 2,
    timestamp: new Date('2024-01-15T10:35:00Z'),
    severity: 'MEDIUM',
    source: 'network_monitor',
    classification: 'unusual_traffic',
    isAnomaly: true,
    anomalyScore: 0.78,
    rawRecord: {
      event_id: 'EVT-002',
      timestamp: '2024-01-15T10:35:00Z',
      severity: 'MEDIUM',
      source: 'network_monitor',
      message: 'Unusual network traffic pattern detected',
      bytes_sent: 52428800,
      bytes_received: 1048576,
      classification: 'unusual_traffic'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 3,
    timestamp: new Date('2024-01-15T10:40:00Z'),
    severity: 'LOW',
    source: 'system_logs',
    classification: 'configuration_change',
    isAnomaly: false,
    anomalyScore: 0.15,
    rawRecord: {
      event_id: 'EVT-003',
      timestamp: '2024-01-15T10:40:00Z',
      severity: 'LOW',
      source: 'system_logs',
      message: 'System configuration updated',
      user: 'sysadmin',
      changes: ['firewall_rules_updated'],
      classification: 'configuration_change'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 4,
    timestamp: new Date('2024-01-15T10:45:00Z'),
    severity: 'CRITICAL',
    source: 'vulnerability_scanner',
    classification: 'vulnerability_detected',
    isAnomaly: true,
    anomalyScore: 0.95,
    rawRecord: {
      event_id: 'EVT-004',
      timestamp: '2024-01-15T10:45:00Z',
      severity: 'CRITICAL',
      source: 'vulnerability_scanner',
      message: 'Critical vulnerability detected in service',
      service: 'api_gateway',
      cve_id: 'CVE-2024-1234',
      classification: 'vulnerability_detected'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 5,
    timestamp: new Date('2024-01-15T10:50:00Z'),
    severity: 'MEDIUM',
    source: 'file_integrity',
    classification: 'file_modification',
    isAnomaly: true,
    anomalyScore: 0.65,
    rawRecord: {
      event_id: 'EVT-005',
      timestamp: '2024-01-15T10:50:00Z',
      severity: 'MEDIUM',
      source: 'file_integrity',
      message: 'System file modification detected',
      file_path: '/etc/passwd',
      modification_type: 'content_change',
      classification: 'file_modification'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 6,
    timestamp: new Date('2024-01-15T10:55:00Z'),
    severity: 'HIGH',
    source: 'process_monitor',
    classification: 'suspicious_process',
    isAnomaly: true,
    anomalyScore: 0.88,
    rawRecord: {
      event_id: 'EVT-006',
      timestamp: '2024-01-15T10:55:00Z',
      severity: 'HIGH',
      source: 'process_monitor',
      message: 'Suspicious process execution detected',
      process_name: 'suspicious.exe',
      parent_process: 'svchost.exe',
      classification: 'suspicious_process'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 7,
    timestamp: new Date('2024-01-15T11:00:00Z'),
    severity: 'LOW',
    source: 'system_logs',
    classification: 'normal_operation',
    isAnomaly: false,
    anomalyScore: 0.05,
    rawRecord: {
      event_id: 'EVT-007',
      timestamp: '2024-01-15T11:00:00Z',
      severity: 'LOW',
      source: 'system_logs',
      message: 'Normal system operation',
      status: 'healthy',
      classification: 'normal_operation'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 8,
    timestamp: new Date('2024-01-15T11:05:00Z'),
    severity: 'HIGH',
    source: 'network_monitor',
    classification: 'port_scanning',
    isAnomaly: true,
    anomalyScore: 0.91,
    rawRecord: {
      event_id: 'EVT-008',
      timestamp: '2024-01-15T11:05:00Z',
      severity: 'HIGH',
      source: 'network_monitor',
      message: 'Port scanning activity detected',
      source_ip: '203.0.113.45',
      ports_scanned: 100,
      classification: 'port_scanning'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 9,
    timestamp: new Date('2024-01-15T11:10:00Z'),
    severity: 'MEDIUM',
    source: 'auth_service',
    classification: 'privilege_escalation',
    isAnomaly: true,
    anomalyScore: 0.76,
    rawRecord: {
      event_id: 'EVT-009',
      timestamp: '2024-01-15T11:10:00Z',
      severity: 'MEDIUM',
      source: 'auth_service',
      message: 'Privilege escalation attempt detected',
      user: 'user123',
      target_role: 'admin',
      classification: 'privilege_escalation'
    }
  },
  {
    dataset: 'darkknight25/Advanced_SIEM_Dataset',
    config: 'default',
    split: 'train',
    rowIdx: 10,
    timestamp: new Date('2024-01-15T11:15:00Z'),
    severity: 'CRITICAL',
    source: 'malware_detection',
    classification: 'malware_detected',
    isAnomaly: true,
    anomalyScore: 0.99,
    rawRecord: {
      event_id: 'EVT-010',
      timestamp: '2024-01-15T11:15:00Z',
      severity: 'CRITICAL',
      source: 'malware_detection',
      message: 'Malware detected',
      malware_name: 'Trojan.Win32.Generic',
      file_path: 'C:\\Windows\\Temp\\malware.exe',
      classification: 'malware_detected'
    }
  }
];

const run = async () => {
  const mongoURI = process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI_DOCKER
    : process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error('MongoDB URI is missing. Set MONGODB_URI or MONGODB_URI_DOCKER.');
  }

  await mongoose.connect(mongoURI);

  try {
    // Clear existing records for this dataset
    const deleteResult = await SiemDatasetRecord.deleteMany({
      dataset: 'darkknight25/Advanced_SIEM_Dataset'
    });
    console.log(`Cleared ${deleteResult.deletedCount} existing records`);

    // Insert sample records
    const result = await SiemDatasetRecord.insertMany(SAMPLE_RECORDS);
    console.log(`Inserted ${result.length} sample SIEM dataset records`);

    // Get statistics
    const total = await SiemDatasetRecord.countDocuments({
      dataset: 'darkknight25/Advanced_SIEM_Dataset'
    });
    const anomalies = await SiemDatasetRecord.countDocuments({
      dataset: 'darkknight25/Advanced_SIEM_Dataset',
      isAnomaly: true
    });

    console.log(JSON.stringify({
      success: true,
      inserted: result.length,
      total,
      anomalies
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(JSON.stringify({ success: false, error: error.message }, null, 2));
  try {
    await mongoose.disconnect();
  } catch (_) {
    // Ignore disconnect errors
  }
  process.exit(1);
});
