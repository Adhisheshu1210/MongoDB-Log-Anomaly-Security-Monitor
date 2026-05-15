# Complete MongoDB Logs Backend Documentation

## Overview
The logs backend provides a complete MongoDB-based log management system with advanced filtering, anomaly detection, and real-time capabilities.

---

## API Endpoints

### 1. **GET /api/logs** - Fetch Logs with Filtering
Get all logs with advanced filtering, pagination, and sorting.

**Parameters:**
- `page` (int, default: 1) - Page number
- `limit` (int, default: 50, max: 500) - Logs per page
- `severity` (string) - Comma-separated: FATAL, ERROR, WARNING, INFO, DEBUG, TRACE
- `component` (string) - Comma-separated component names
- `classification` (string) - Log classification filter
- `isAnomaly` (boolean) - true/false for anomaly logs only
- `startDate` (ISO string) - Start date filter
- `endDate` (ISO string) - End date filter
- `search` (string) - Full-text search on message and component
- `sort` (string, default: -timestamp) - Sort field/order

**Example:**
```bash
GET /api/logs?severity=ERROR,WARNING&page=1&limit=50&sort=-timestamp
GET /api/logs?startDate=2026-05-01&endDate=2026-05-14&classification=slow_query
GET /api/logs?search=database+connection&isAnomaly=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "66...",
      "timestamp": "2026-05-14T10:30:00Z",
      "severity": "ERROR",
      "component": "database",
      "message": "Connection timeout",
      "classification": "connection_spike",
      "isAnomaly": true,
      "anomalyScore": 0.87,
      "source": "mongodb"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25,
    "hasMore": true
  }
}
```

---

### 2. **GET /api/logs/stats** - Log Statistics
Get comprehensive log statistics and analytics for a period.

**Parameters:**
- `days` (int, default: 7) - Number of days to analyze

**Example:**
```bash
GET /api/logs/stats?days=7
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "days": 7,
      "since": "2026-05-07T14:30:00Z"
    },
    "totalLogs": 45230,
    "anomalyCount": 342,
    "anomalyPercentage": 0.75,
    "severityBreakdown": [
      { "_id": "INFO", "count": 32150 },
      { "_id": "WARNING", "count": 8900 },
      { "_id": "ERROR", "count": 4180 }
    ],
    "classificationBreakdown": [
      { "_id": "normal", "count": 43000 },
      { "_id": "slow_query", "count": 1200 },
      { "_id": "connection_spike", "count": 342 }
    ],
    "topComponents": [
      { "_id": "database", "count": 22100 },
      { "_id": "api", "count": 15600 },
      { "_id": "auth", "count": 7530 }
    ],
    "recentErrors": [
      {
        "id": "66...",
        "message": "Query timeout",
        "component": "database",
        "timestamp": "2026-05-14T10:25:00Z"
      }
    ]
  }
}
```

---

### 3. **GET /api/logs/recent/:limit** - Recent Logs
Get the most recent log entries (real-time feed).

**Parameters:**
- `limit` (int, path) - Number of recent logs (max: 500)

**Example:**
```bash
GET /api/logs/recent/50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "66...",
      "timestamp": "2026-05-14T10:45:00Z",
      "severity": "INFO",
      "component": "api",
      "message": "Request processed",
      "classification": "normal",
      "isAnomaly": false,
      "anomalyScore": 0
    }
  ]
}
```

---

### 4. **GET /api/logs/anomalies** - Anomalous Logs
Get logs detected as anomalies with anomaly scoring.

**Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 50)
- `minScore` (float, default: 0.5) - Minimum anomaly score (0-1)
- `maxScore` (float, default: 1) - Maximum anomaly score (0-1)
- `sort` (string, default: -anomalyScore)

**Example:**
```bash
GET /api/logs/anomalies?minScore=0.8&limit=100
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "66...",
      "timestamp": "2026-05-14T10:25:00Z",
      "severity": "ERROR",
      "component": "database",
      "message": "Unusual connection pattern detected",
      "classification": "connection_spike",
      "isAnomaly": true,
      "anomalyScore": 0.92
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 342,
    "pages": 4
  }
}
```

---

### 5. **GET /api/logs/:id** - Get Single Log
Retrieve full details of a specific log entry.

**Example:**
```bash
GET /api/logs/6617f4b8c1234567890abcde
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6617f4b8c1234567890abcde",
    "timestamp": "2026-05-14T10:30:00Z",
    "severity": "ERROR",
    "component": "database",
    "message": "Connection timeout",
    "context": {
      "connectionId": 123,
      "remote": "192.168.1.100",
      "duration": 5000
    },
    "classification": "connection_spike",
    "isAnomaly": true,
    "anomalyScore": 0.87,
    "source": "mongodb"
  }
}
```

---

### 6. **POST /api/logs** - Create Log
Manually create a new log entry (for testing or API-driven logging).

**Request Body:**
```json
{
  "timestamp": "2026-05-14T10:30:00Z",
  "severity": "ERROR",
  "component": "api",
  "message": "Critical system error occurred",
  "context": {
    "userId": "user123",
    "action": "process_payment"
  },
  "classification": "unknown"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6617f4b8c1234567890abcde",
    "timestamp": "2026-05-14T10:30:00Z",
    "severity": "ERROR",
    "component": "api",
    "message": "Critical system error occurred",
    "source": "manual"
  }
}
```

---

### 7. **PUT /api/logs/:id** - Update Log
Update log classification or anomaly status.

**Allowed Fields:**
- `classification` - Reclassify the log
- `isAnomaly` - Mark as anomaly
- `anomalyScore` - Update anomaly score

**Request Body:**
```json
{
  "classification": "slow_query",
  "isAnomaly": true,
  "anomalyScore": 0.95
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "66...",
    "timestamp": "2026-05-14T10:30:00Z",
    "classification": "slow_query",
    "isAnomaly": true,
    "anomalyScore": 0.95
  }
}
```

---

### 8. **DELETE /api/logs/:id** - Delete Log
Delete a single log entry (Admin only).

**Example:**
```bash
DELETE /api/logs/6617f4b8c1234567890abcde
```

**Response:**
```json
{
  "success": true,
  "message": "Log deleted successfully"
}
```

---

### 9. **DELETE /api/logs** - Bulk Delete Logs
Delete multiple logs by filter (Admin only).

**Parameters:**
- `olderThanDays` (int) - Delete logs older than X days
- `startDate` (ISO string) - Delete logs after this date
- `endDate` (ISO string) - Delete logs before this date
- `severity` (string) - Comma-separated severities to delete
- `classification` (string) - Classifications to delete

**Example:**
```bash
DELETE /api/logs?olderThanDays=30
DELETE /api/logs?severity=DEBUG,TRACE
DELETE /api/logs?startDate=2026-01-01&endDate=2026-02-01
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted 5000 logs",
  "deletedCount": 5000
}
```

---

### 10. **GET /api/logs/export** - Export Logs
Export logs as CSV with optional filtering.

**Parameters:**
- `format` (string, default: csv) - Export format
- `source` (string, default: core) - core or siem
- `severity` (string) - Filter by severity
- `classification` (string) - Filter by classification

**Example:**
```bash
GET /api/logs/export?severity=ERROR
GET /api/logs/export?classification=slow_query&source=core
```

**Response:**
CSV file download with columns: id, timestamp, level, classification, isAnomaly, anomalyScore, source, message, metadataJson

---

## Database Schema (Log Model)

```javascript
{
  _id: ObjectId,
  
  // Timestamp (indexed)
  timestamp: Date,
  
  // Log Level (indexed)
  severity: enum['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'],
  
  // Service/Component (indexed)
  component: String,
  
  // Log Message
  message: String,
  
  // Additional Context
  context: {
    connectionId: Number,
    remote: String,
    pid: Number,
    duration: Number,
    ...
  },
  
  // Raw Log Entry
  raw: String,
  
  // Classification (indexed)
  classification: enum[
    'normal',
    'slow_query',
    'auth_failure',
    'unauthorized_access',
    'replication_error',
    'connection_spike',
    'memory_issue',
    'disk_issue',
    'unknown'
  ],
  
  // Anomaly Detection (indexed)
  isAnomaly: Boolean,
  anomalyScore: Number (0-1),
  
  // Metadata
  processedAt: Date,
  source: enum['mongodb', 'manual', 'api', 'ingestion', 'webhook'],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Indexes

The Log model includes the following indexes for optimal query performance:

1. `{ timestamp: -1, severity: 1 }` - Severity filtering by time
2. `{ timestamp: -1, classification: 1 }` - Classification filtering by time
3. `{ isAnomaly: 1, timestamp: -1 }` - Anomaly detection
4. `{ component: 1, timestamp: -1 }` - Component-specific logs
5. `{ message: 'text', component: 'text' }` - Full-text search
6. `{ timestamp: -1 }` - Recent logs retrieval
7. `{ source: 1, timestamp: -1 }` - Source-based filtering

---

## Features

### ✅ Advanced Filtering
- Filter by severity, component, classification
- Date range filtering
- Full-text search on message and component
- Anomaly detection filtering

### ✅ Pagination
- Page-based pagination with limit control
- Total count and pages calculation
- hasMore flag for infinite scroll support

### ✅ Anomaly Detection
- Anomaly scoring (0-1 scale)
- Dedicated anomaly logs endpoint
- Anomaly percentage calculation

### ✅ Statistics & Analytics
- Log count by severity
- Log count by classification
- Top components analysis
- Recent error retrieval
- Anomaly percentage tracking

### ✅ Real-time Updates
- WebSocket support for new log events
- Recent logs endpoint for live feed
- Event emission on log creation

### ✅ Export Capabilities
- CSV export with filtering
- Support for core logs and SIEM dataset export
- Metadata inclusion in export

### ✅ Capped Collection
- Automatic cleanup of old logs
- 1GB size limit
- Maximum 1M documents
- Oldest logs automatically deleted

### ✅ RBAC Support
- Admin-only operations for delete
- Permission checking for export
- User-aware logging

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": "Detailed error info (development mode only)"
}
```

**Status Codes:**
- `200 OK` - Successful request
- `201 Created` - Log created
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Usage Examples

### Get ERRORs and WARNINGs from last 7 days
```bash
GET /api/logs?severity=ERROR,WARNING&startDate=2026-05-07&endDate=2026-05-14
```

### Find anomalies with high confidence
```bash
GET /api/logs/anomalies?minScore=0.8&sort=-anomalyScore
```

### Get database-related logs
```bash
GET /api/logs?component=database&sort=-timestamp
```

### Search for connection issues
```bash
GET /api/logs?search=connection+timeout&classification=connection_spike
```

### Get statistics for monitoring
```bash
GET /api/logs/stats?days=30
```

### Export all errors as CSV
```bash
GET /api/logs/export?severity=ERROR&format=csv
```

### Delete old debug logs (older than 7 days)
```bash
DELETE /api/logs?olderThanDays=7&severity=DEBUG,TRACE
```

---

## Access Control

| Endpoint | Method | Auth Required | Admin Only |
|----------|--------|---|---|
| /api/logs | GET | ✓ | ✗ |
| /api/logs | POST | ✓ | ✗ |
| /api/logs | DELETE | ✓ | ✓ |
| /api/logs/:id | GET | ✓ | ✗ |
| /api/logs/:id | PUT | ✓ | ✗ |
| /api/logs/:id | DELETE | ✓ | ✓ |
| /api/logs/stats | GET | ✓ | ✗ |
| /api/logs/recent/:limit | GET | ✓ | ✗ |
| /api/logs/anomalies | GET | ✓ | ✗ |
| /api/logs/export | GET | ✓ | ✗ |

---

## Performance Notes

- Uses `.lean()` for read-only queries (faster)
- Composite indexes for common filter combinations
- Full-text search index for message searching
- Capped collection for automatic cleanup
- Pagination limits maximum 500 logs per request
- Aggregation pipelines for statistics

---

## Integration with Frontend

The logs backend seamlessly integrates with the frontend audit logs component:

```javascript
// Frontend service call
const response = await auditLogsService.getAuditLogs({
  page: 1,
  limit: 50,
  action: "PERMISSION_CHANGE,SECURITY_ALERT"
});

// Returns: { success: true, data: [...], pagination: {...} }
```

---

## Future Enhancements

- [ ] Log streaming via WebSocket
- [ ] Advanced ML-based anomaly detection
- [ ] Log retention policies
- [ ] Distributed tracing support
- [ ] Log aggregation from multiple sources
- [ ] Real-time alerting on critical logs
- [ ] Log correlation and root cause analysis
