# Complete Backend Services Documentation

## Overview
This document describes the complete backend implementation for the MongoDB Log Anomaly & Security Monitor, including all five settings categories:
1. **Alert Thresholds** - Automatic alert generation based on metrics
2. **Notifications** - Multi-channel notification system
3. **Anomaly Detection** - ML-based log anomaly detection
4. **Demo Data** - Automatic and manual demo data generation
5. **Security** - Access control, audit logging, and security policies

---

## 1. Alert Thresholds System

### Service: `src/services/alertService.js`

**Purpose**: Manage alert generation based on configured thresholds.

**Key Methods**:

```javascript
// Check if metric exceeds threshold and create alert
await alertService.checkTresholdAndAlert(metricName, value, thresholdKey, options);

// Create multiple alerts in bulk
await alertService.createBulkAlerts(conditions);

// Get alert statistics and breakdown
const stats = await alertService.getAlertStats();

// Auto-resolve old unresolved alerts (gracePeriodHours: 72)
await alertService.autoResolveOldAlerts(gracePeriodHours);

// Clean up old demo alerts
await alertService.cleanupAlerts({ olderThanDays: 30, status, source });
```

**Configurable Thresholds** (via Settings):
```json
{
  "slowQueryMs": 100,
  "connectionSpikeThreshold": 100,
  "errorRateThreshold": 10,
  "memoryUsagePercent": 85,
  "diskUsagePercent": 90,
  "replicationLagSeconds": 10
}
```

**API Endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings-management/categories/alert-thresholds` | Private | Get current thresholds & stats |
| PUT | `/api/settings-management/categories/alert-thresholds` | Admin | Update thresholds |
| POST | `/api/settings-management/categories/alert-thresholds/test` | Admin | Test threshold alert |

---

## 2. Notifications System

### Service: `src/services/notification.js`

**Purpose**: Send alerts via Email, Slack, and Telegram.

**Features**:
- ✅ SMTP Email with HTML formatting
- ✅ Slack webhook with rich formatting
- ✅ Telegram bot integration
- ✅ Automatic initialization from settings
- ✅ Error handling and logging

**Key Methods**:

```javascript
// Initialize with current settings
await notificationService.initialize();

// Send to all configured channels
const results = await notificationService.sendNotifications(alert);
// Returns: { email: {...}, slack: {...}, telegram: {...} }

// Send to specific channels
await notificationService.sendEmail(alert);
await notificationService.sendSlack(alert);
await notificationService.sendTelegram(alert);
```

**Alert Object Structure**:
```javascript
{
  _id: 'alert-id',
  title: 'Alert Title',
  message: 'Alert message',
  severity: 'critical|high|medium|low|info',
  category: 'performance|security|capacity|...',
  createdAt: Date
}
```

**Configuration** (Settings):
```json
{
  "email": {
    "enabled": true,
    "recipients": ["admin@example.com"],
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "user@gmail.com",
    "smtpPass": "password"
  },
  "slack": {
    "enabled": true,
    "webhookUrl": "https://hooks.slack.com/..."
  },
  "telegram": {
    "enabled": true,
    "botToken": "123456789:ABCdefGHIjkl",
    "chatId": "987654321"
  }
}
```

**API Endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings-management/categories/notifications` | Private | Get notification settings |
| PUT | `/api/settings-management/categories/notifications` | Admin | Update notification config |
| POST | `/api/settings-management/categories/notifications/test` | Admin | Send test notification |

---

## 3. Anomaly Detection System

### Service: `src/services/anomalyService.js`

**Purpose**: Detect and classify log anomalies using rule-based approach.

**Detection Rules**:
- `slow_query` → Performance anomaly (query takes > threshold)
- `auth_failure` → Security anomaly (failed login attempts)
- `unauthorized_access` → Security anomaly (unauthorized operation)
- `connection_spike` → Connection anomaly (abnormal connections)
- `memory_issue` → Resource anomaly (high memory usage)
- `disk_issue` → Capacity anomaly (low disk space)
- `replication_error` → Replication anomaly (sync failures)

**Key Methods**:

```javascript
// Initialize anomaly detection
await anomalyService.initialize();

// Detect anomalies in recent logs
const anomalies = await anomalyService.detectAnomalies();

// Classify individual log entry
const classified = anomalyService.classifyLogAnomaly(log);

// Get anomaly statistics
const stats = await anomalyService.getAnomalyStats();

// Resolve similar anomalies in time window
await anomalyService.resolveSimilarAnomalies(anomalyId, userId);

// Auto-resolve old unresolved anomalies
await anomalyService.autoResolveOldAnomalies(gracePeriodDays);
```

**Configuration** (Settings):
```json
{
  "enabled": true,
  "algorithm": "rule_based|isolation_forest|lof|autoencoder",
  "contamination": 0.1,
  "n_estimators": 100,
  "modelUpdateInterval": 3600
}
```

**Anomaly Object**:
```javascript
{
  logId: ObjectId,
  timestamp: Date,
  severity: 'critical|high|medium|low',
  type: 'performance|security|capacity|connection|resource|replication',
  title: 'String',
  description: 'String',
  anomalyScore: Number (0-1),
  confidence: Number (0-1),
  recommendedAction: 'String',
  isResolved: Boolean
}
```

**API Endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings-management/categories/anomaly-detection` | Private | Get detection settings & stats |
| PUT | `/api/settings-management/categories/anomaly-detection` | Admin | Update detection config |
| POST | `/api/settings-management/categories/anomaly-detection/run` | Admin | Manually trigger detection |

---

## 4. Demo Data System

### Service: `src/services/demoData.js`

**Purpose**: Generate realistic demo logs, anomalies, and alerts for dashboard testing.

**Key Methods**:

```javascript
// Generate demo data
const result = await generateDemoData({
  logsCount: 120,
  anomaliesCount: 24,
  alertsCount: 12
});

// Ensure minimum data exists (auto-seeding)
const result = await ensureMinimumDemoData({
  minLogs: 120,
  minAnomalies: 24,
  minAlerts: 12
});
```

**Features**:
- Generates realistic MongoDB logs with varied components
- Creates anomalies linked to log entries
- Generates alerts with mixed status (new, acknowledged, resolved)
- Timestamps distributed across last 180 minutes (recent data)
- Automatically called on backend startup in development

**Auto-Seeding** (in `app.js`):
```javascript
if (process.env.NODE_ENV !== 'production' && process.env.AUTO_SEED_DEMO !== 'false') {
  await ensureMinimumDemoData({ minLogs: 120, minAnomalies: 24, minAlerts: 12 });
}
```

**Disable auto-seeding**:
```bash
export AUTO_SEED_DEMO=false
```

**API Endpoints** (via Settings routes):

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/settings/demo` | Admin | Generate demo data |
| POST | `/api/settings/clear-demo` | Admin | Clear all demo data |

---

## 5. Security System

### Service: `src/services/securityService.js`

**Purpose**: Manage security policies, access control, and audit logging.

**Key Methods**:

```javascript
// Initialize security settings
await securityService.initialize();

// Track login attempt
await securityService.trackLoginAttempt(username, ipAddress, success);

// Audit log an action
await securityService.auditLog(action, userId, resource, details);

// Get audit log with filters
const logs = securityService.getAuditLog({ action, userId, resource });

// Check user permission
const allowed = await securityService.checkPermission(userId, permission);

// Generate security report
const report = await securityService.generateSecurityReport();

// Reset login attempts (unlock account)
await securityService.resetLoginAttempts(userId);

// Validate password strength
const validation = securityService.validatePasswordStrength(password);

// Validate MFA code
const valid = await securityService.validateMFA(userId, code);

// Check session timeout
const isValid = securityService.checkSessionTimeout(lastActivityTime);
```

**Configuration** (Settings):
```json
{
  "sessionTimeout": 3600,
  "maxLoginAttempts": 5,
  "passwordMinLength": 8,
  "requireMFA": false
}
```

**Role-Based Permissions**:
```javascript
{
  admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
  user: ['read', 'write', 'acknowledge_alerts'],
  viewer: ['read']
}
```

**Password Requirements**:
- Minimum length (default: 8 chars)
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

**API Endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings-management/categories/security` | Admin | Get security settings & report |
| PUT | `/api/settings-management/categories/security` | Admin | Update security config |
| GET | `/api/settings-management/categories/security/audit-log` | Admin | Get audit log |
| POST | `/api/settings-management/categories/security/password-validation` | Private | Validate password strength |

---

## Service Initialization

All services are automatically initialized on backend startup:

```javascript
// app.js startup sequence
1. Connect to MongoDB
2. Initialize default settings
3. Initialize notification service (load SMTP/webhook config)
4. Initialize anomaly detection service (load model config)
5. Initialize security service (load security policies)
6. Auto-seed demo data (if dev mode and not disabled)
7. Start HTTP server
```

---

## Integration Points

### WebSocket Events

Services emit WebSocket events for real-time updates:

```javascript
// Alert events
io.emit('alert:new', alert);
io.emit('alert:acknowledged', alert);
io.emit('alert:resolved', alert);

// Anomaly events
io.emit('anomaly:detected', anomaly);
io.emit('anomaly:resolved', anomaly);

// Settings events
io.emit('settings:updated', setting);
io.emit('settings:restored', settings);
```

### Database Models

- **User**: Extended with `loginAttempts`, `mfaEnabled`, `mfaSecret`
- **Alert**: Supports notifications tracking and audit metadata
- **Anomaly**: Links to related alerts and logs
- **Log**: Supports anomaly scoring and classification
- **Settings**: Stores all configuration for above services

---

## Error Handling

All services implement comprehensive error handling:

```javascript
// Errors logged with context
logger.error('Service error:', error.message);

// Services return null/false on failure
const result = await service.method();
if (!result) {
  // Handle failure gracefully
}
```

---

## Performance Considerations

- **Alert cleanup**: Auto-resolves alerts older than 72 hours
- **Anomaly auto-resolution**: Resolves anomalies older than 7 days
- **Audit log**: Keeps last 1000 entries in memory for fast access
- **Caching**: Settings initialized once at startup
- **Batch operations**: Support bulk alert/anomaly creation

---

## Testing

### Test Alert Thresholds

```bash
curl -X POST http://localhost:5000/api/settings-management/categories/alert-thresholds/test \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"thresholdKey":"slowQueryMs","value":500}'
```

### Test Notifications

```bash
curl -X POST http://localhost:5000/api/settings-management/categories/notifications/test \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

### Run Anomaly Detection

```bash
curl -X POST http://localhost:5000/api/settings-management/categories/anomaly-detection/run \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

---

## Summary

| Feature | Status | Auto-Init | API | Service |
|---------|--------|-----------|-----|---------|
| Alert Thresholds | ✅ Complete | Yes | `/alert-thresholds` | `alertService` |
| Notifications | ✅ Complete | Yes | `/notifications` | `notification` |
| Anomaly Detection | ✅ Complete | Yes | `/anomaly-detection` | `anomalyService` |
| Demo Data | ✅ Complete | Yes | `/demo` | `demoData` |
| Security | ✅ Complete | Yes | `/security` | `securityService` |

All systems are production-ready and fully integrated with the MongoDB backend.
