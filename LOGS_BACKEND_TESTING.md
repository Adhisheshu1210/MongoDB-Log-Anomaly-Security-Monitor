# Logs Backend - Quick Testing Guide

## Setup

1. Ensure MongoDB is running:
```bash
mongodb://localhost:27017/mongodb
```

2. Ensure backend is running:
```bash
cd d:\mongodb\backend
npm start
```

3. Frontend should be running:
```bash
cd d:\mongodb\frontend
npm run dev
```

---

## Testing with cURL

### Create a Test Log Entry
```bash
curl -X POST http://localhost:5000/api/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "timestamp": "2026-05-14T10:30:00Z",
    "severity": "ERROR",
    "component": "database",
    "message": "Connection timeout occurred",
    "context": {
      "connectionId": 123,
      "duration": 5000
    },
    "classification": "connection_spike",
    "isAnomaly": true,
    "anomalyScore": 0.87
  }'
```

### Fetch All Logs
```bash
curl http://localhost:5000/api/logs?page=1&limit=50 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Fetch Logs with Filtering
```bash
curl "http://localhost:5000/api/logs?severity=ERROR,WARNING&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Anomalies Only
```bash
curl "http://localhost:5000/api/logs/anomalies?minScore=0.8&limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Statistics
```bash
curl "http://localhost:5000/api/logs/stats?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Recent Logs
```bash
curl http://localhost:5000/api/logs/recent/50 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update a Log
```bash
curl -X PUT http://localhost:5000/api/logs/LOG_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "classification": "slow_query",
    "isAnomaly": true,
    "anomalyScore": 0.95
  }'
```

### Delete a Log (Admin Only)
```bash
curl -X DELETE http://localhost:5000/api/logs/LOG_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Bulk Delete Logs (Admin Only)
```bash
curl -X DELETE "http://localhost:5000/api/logs?olderThanDays=30" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Export Logs as CSV
```bash
curl "http://localhost:5000/api/logs/export?severity=ERROR" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o logs_export.csv
```

---

## Testing with Postman

Import the provided Postman collection:
`backend/postman/MongoDB-Log-Anomaly-Security-Monitor-OTP.postman_collection.json`

**Pre-request Script (for all requests):**
```javascript
// Automatically includes auth token from environment
const token = pm.environment.get('auth_token');
if (token) {
  pm.request.headers.add({
    key: 'Authorization',
    value: `Bearer ${token}`
  });
}
```

---

## Database Verification

### Check Log Collection Stats
```bash
# In MongoDB Shell
use mongodb
db.logs.stats()

# Should show capped collection with:
# - size: 1073741824 (1GB)
# - max: 1000000 documents
# - count: current number of logs
```

### Check Indexes
```bash
db.logs.getIndexes()

# Should show:
# - { timestamp: -1, severity: 1 }
# - { timestamp: -1, classification: 1 }
# - { isAnomaly: 1, timestamp: -1 }
# - { component: 1, timestamp: -1 }
# - { message: 'text', component: 'text' }
# - { timestamp: -1 }
# - { source: 1, timestamp: -1 }
```

### Verify Documents
```bash
# Count total logs
db.logs.countDocuments()

# Find ERROR logs
db.logs.find({ severity: 'ERROR' }).count()

# Find anomalies
db.logs.find({ isAnomaly: true }).count()

# Get recent logs
db.logs.find().sort({ timestamp: -1 }).limit(10).pretty()

# Full-text search
db.logs.find({ $text: { $search: "timeout" } })
```

---

## Frontend Testing

### Access Admin Dashboard
1. Navigate to: `http://localhost:3000/admin/logs` (if logs page exists)
2. Login with admin credentials
3. View real-time logs
4. Test filtering by severity, component, classification
5. Test anomaly detection view

### Test with Sample Data
The backend supports creating logs via API for testing:

```bash
#!/bin/bash
# Create multiple test logs

TOKEN="YOUR_AUTH_TOKEN"
BASE_URL="http://localhost:5000/api"

# Create 10 random logs
for i in {1..10}; do
  curl -X POST $BASE_URL/logs \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"timestamp\": \"$(date -u +'%Y-%m-%dT%H:%M:%SZ')\",
      \"severity\": \"$(shuf -e FATAL ERROR WARNING INFO DEBUG | head -1)\",
      \"component\": \"$(shuf -e database api auth cache | head -1)\",
      \"message\": \"Test log entry $i\",
      \"classification\": \"normal\",
      \"isAnomaly\": false
    }"
    sleep 1
done

echo "Created 10 test logs"
```

---

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test GET endpoint
ab -n 1000 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/logs

# Expected: ~100-500 requests/sec depending on database size
```

### Check Query Performance
```bash
# In MongoDB, enable profiling
db.setProfilingLevel(1, { slowms: 100 })

# Check slow queries
db.system.profile.find().pretty()
```

---

## Monitoring

### Log Count Over Time
```bash
curl "http://localhost:5000/api/logs/stats?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitor Anomalies
```bash
curl "http://localhost:5000/api/logs/anomalies?limit=100&sort=-anomalyScore" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Component Distribution
```bash
curl "http://localhost:5000/api/logs/stats?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  # Look for topComponents in response
```

---

## Troubleshooting

### No logs appearing?
1. Check MongoDB connection: `mongo mongodb://localhost:27017/mongodb`
2. Verify logs collection exists: `db.logs.find().count()`
3. Check server logs for errors

### Slow queries?
1. Verify indexes are created: `db.logs.getIndexes()`
2. Check MongoDB profiling: `db.system.profile.find().limit(5).pretty()`
3. Monitor index usage: `db.logs.aggregate([{ $indexStats: {} }])`

### Authentication failing?
1. Verify token is valid
2. Check Authorization header format: `Bearer TOKEN`
3. Ensure user has required permissions

### Export not working?
1. Verify export permission in RBAC
2. Check CSV headers: `Content-Type: text/csv`
3. Ensure logs exist in specified range

---

## Integration Checklist

- [x] Log Model created with proper indexes
- [x] Log Routes with all CRUD operations
- [x] Filtering by severity, component, classification
- [x] Pagination support
- [x] Anomaly detection endpoints
- [x] Statistics and analytics
- [x] Export functionality
- [x] Error handling and validation
- [x] RBAC integration
- [x] WebSocket support for real-time updates
- [x] Capped collection setup
- [x] Full-text search
- [x] Development error messages

---

## Next Steps

1. **Frontend Integration:**
   - Create logs page in admin dashboard
   - Add real-time log streaming
   - Implement anomaly alerts

2. **Log Ingestion:**
   - Set up MongoDB log ingester
   - Configure log collectors
   - Implement auto-classification

3. **Alerting:**
   - Create alerts on critical logs
   - Set up email/Slack notifications
   - Configure escalation policies

4. **Analytics:**
   - Build dashboards
   - Create reports
   - Track trends

---

## API Health Check

```bash
# Quick health check for logs API
curl http://localhost:5000/api/logs?limit=1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: HTTP Status: 200
```

---

**Last Updated:** 2026-05-14
**Status:** ✅ Complete and Ready for Testing
