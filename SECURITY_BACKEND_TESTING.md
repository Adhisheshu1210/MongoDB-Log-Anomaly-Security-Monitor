# Security Backend Testing Guide

Complete testing procedures for the security backend API with real threat intelligence integration.

---

## Prerequisites

1. MongoDB running on `localhost:27017`
2. Backend running on `http://localhost:5000`
3. SiemDatasetRecords populated in MongoDB
4. Valid JWT token for authentication
5. cURL or Postman installed

---

## Test Dataset Setup

### Import Sample SIEM Data

Before testing, ensure SiemDatasetRecords are populated:

```bash
# Via Node.js script
cd backend
node scripts/importSiemDataset.js

# Or seed data manually
mongosh mongodb://localhost:27017/mongodb

db.siemdatasetrecords.insertMany([
  {
    "timestamp": new Date(Date.now() - 3600000),
    "severity": "CRITICAL",
    "classification": "unauthorized_access",
    "isAnomaly": true,
    "anomalyScore": 0.95,
    "source": "network",
    "rawRecord": {
      "src_ip": "212.102.35.45",
      "src_country": "Germany",
      "dst_ip": "10.0.0.50",
      "dst_port": 22,
      "protocol": "SSH",
      "action": "DENIED",
      "label": "Brute force"
    }
  }
])
```

---

## Unit Tests

### Test 1: Get Security Overview

**Endpoint**: `GET /api/security/overview`

**Request**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:5000/api/security/overview?days=7
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": {
      "days": 7,
      "since": "2026-05-07T12:00:00.000Z"
    },
    "totalThreats": 2402,
    "criticalThreats": 145,
    "anomalyCount": 389,
    "failedAttempts": 1023,
    "protectionScore": 94,
    "riskLevel": "LOW"
  }
}
```

**Validation**:
- [ ] Response contains all required fields
- [ ] riskLevel is one of: CRITICAL, HIGH, MEDIUM, LOW, MINIMAL
- [ ] protectionScore is 0-100
- [ ] period.since is valid ISO date

**Test Variations**:
```bash
# Test different day ranges
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/security/overview?days=1

curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/security/overview?days=30
```

---

### Test 2: Get Threats with Filtering

**Endpoint**: `GET /api/security/threats`

**Request 1 - All Threats**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:5000/api/security/threats?page=1&limit=50
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "timestamp": "2026-05-14T12:30:00.000Z",
      "severity": "CRITICAL",
      "sourceIp": "192.168.1.100",
      "location": "Frankfurt, DE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2402,
    "pages": 49,
    "hasMore": true
  }
}
```

**Request 2 - Filter by Severity**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  "http://localhost:5000/api/security/threats?severity=CRITICAL,HIGH&limit=25"
```

**Request 3 - Filter by Anomaly**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  "http://localhost:5000/api/security/threats?isAnomaly=true&limit=50"
```

**Request 4 - Date Range Filter**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  "http://localhost:5000/api/security/threats?startDate=2026-05-10&endDate=2026-05-14"
```

**Validation**:
- [ ] Threats array contains expected records
- [ ] Pagination.hasMore is accurate
- [ ] Severity filter reduces result count
- [ ] Date filter includes only records in range
- [ ] Anomaly filter shows only isAnomaly=true records

---

### Test 3: Get Threat Map (Critical Test)

**Endpoint**: `GET /api/security/threat-map`

**Request**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:5000/api/security/threat-map?days=1&limit=100
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "days": 1,
      "since": "2026-05-13T12:00:00.000Z"
    },
    "totalLocations": 15,
    "totalThreats": 2402,
    "threats": [
      {
        "sourceIp": "212.102.35.45",
        "location": "Germany",
        "latitude": 51.1657,
        "longitude": 10.4515,
        "countryCode": "DE",
        "threatCount": 456,
        "severity": "HIGH",
        "ports": [22, 3389],
        "protocols": ["SSH", "RDP"]
      }
    ]
  }
}
```

**Validation**:
- [ ] threats array not empty
- [ ] Each threat has valid latitude/longitude
- [ ] countryCode matches location
- [ ] threatCount is positive integer
- [ ] ports and protocols are arrays
- [ ] severity is valid enum value

**Geo-Location Verification**:
```bash
# Query database to verify source data
mongosh mongodb://localhost:27017/mongodb

db.siemdatasetrecords.find({
  timestamp: { $gte: new Date(Date.now() - 86400000) }
}).select({ 
  "rawRecord.src_ip": 1, 
  "rawRecord.src_country": 1,
  "severity": 1
}).limit(5)
```

---

### Test 4: Get Attack Surface Data

**Endpoint**: `GET /api/security/attack-surface`

**Request**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:5000/api/security/attack-surface?days=1
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "00:00",
      "attempts": 120,
      "anomalies": 15,
      "severity": "MEDIUM"
    },
    {
      "name": "01:00",
      "attempts": 185,
      "anomalies": 23,
      "severity": "HIGH"
    }
  ]
}
```

**Validation**:
- [ ] Data array contains hourly entries
- [ ] Each hour from 00:00 to 23:00 has data
- [ ] attempts is positive integer
- [ ] anomalies <= attempts
- [ ] severity is valid enum
- [ ] Chart data is suitable for LineChart/AreaChart

---

### Test 5: Get Policies

**Endpoint**: `GET /api/security/policies`

**Request**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:5000/api/security/policies
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "mfa",
      "title": "Multi-Factor Auth (MFA)",
      "status": "ENFORCED",
      "description": "Required for all admin-level actions.",
      "active": true,
      "coverage": "100%"
    }
  ]
}
```

**Validation**:
- [ ] Returns 4 policies: mfa, rate-limit, encryption, ai-blocking
- [ ] Each policy has id, title, status, description
- [ ] status is valid: ENFORCED, ACTIVE, LEARNING
- [ ] active is boolean
- [ ] coverage is percentage string

---

### Test 6: Get Vulnerabilities

**Endpoint**: `GET /api/security/vulnerabilities`

**Request**:
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:5000/api/security/vulnerabilities
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "CVE-2026-0912",
      "title": "Kernel Vulnerability Found",
      "severity": "CRITICAL",
      "cveId": "CVE-2026-0912",
      "patchAvailable": true,
      "CVSS": 9.8
    }
  ]
}
```

**Validation**:
- [ ] Returns vulnerability array
- [ ] Each has id, title, severity, cveId
- [ ] CVSS score is 0-10 range
- [ ] patchAvailable is boolean

---

### Test 7: Update Policy (Authorization Required)

**Endpoint**: `PUT /api/security/policies/:id`

**Setup - Get Admin Token**:
```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"admin123"}'

# Store token from response
export ADMIN_TOKEN="your_admin_token_here"
```

**Request**:
```bash
curl -X PUT \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "active": false,
    "description": "Disabled for testing",
    "status": "LEARNING"
  }' \
  http://localhost:5000/api/security/policies/mfa
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Policy updated successfully",
  "data": {
    "id": "mfa",
    "active": false,
    "description": "Disabled for testing",
    "status": "LEARNING",
    "updatedAt": "2026-05-14T12:30:00.000Z"
  }
}
```

**Authorization Tests**:
```bash
# Test without token (should fail 401)
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"active":true}' \
  http://localhost:5000/api/security/policies/mfa

# Test with non-admin token (should fail 403)
curl -X PUT \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"active":true}' \
  http://localhost:5000/api/security/policies/mfa
```

**Validation**:
- [ ] Unauthorized request returns 401
- [ ] Non-admin returns 403
- [ ] Admin request succeeds with 200
- [ ] Response contains updatedAt timestamp

---

## Integration Tests

### Test 8: Full SecurityCenter Flow

**Scenario**: User views SecurityCenter and opens threat map

**Steps**:
1. Load SecurityCenter component
2. Verify overview loads (riskLevel, protectionScore)
3. Verify attack surface chart populates
4. Verify policies display
5. Click "View Detailed Map"
6. Verify threat map modal opens with data

**cURL Simulation**:
```bash
# Step 1: Get overview
OVERVIEW=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/security/overview?days=7)
echo $OVERVIEW | jq '.data | {riskLevel, protectionScore}'

# Step 2: Get attack surface
ATTACKS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/security/attack-surface?days=1)
echo $ATTACKS | jq '.data | length'

# Step 3: Get policies
POLICIES=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/security/policies)
echo $POLICIES | jq '.data | length'

# Step 4: Get threat map for modal
THREATMAP=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/security/threat-map?days=1)
echo $THREATMAP | jq '.data | {totalThreats, totalLocations}'
```

**Validation**:
- [ ] All 4 API calls succeed
- [ ] Data types match frontend expectations
- [ ] No null/undefined values in responses

---

### Test 9: Performance Test

**Objective**: Ensure API responds within acceptable time

**Test Script**:
```bash
#!/bin/bash
echo "Performance Test - Security API"

# Test threat-map response time (should be <1s)
time curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/security/threat-map?days=1 > /dev/null

# Test overview response time (should be <500ms)
time curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/security/overview > /dev/null

# Test pagination with large limit (should be <2s)
time curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/security/threats?limit=500" > /dev/null
```

**Expected Results**:
- /threat-map: < 1000ms
- /overview: < 500ms
- /threats with limit=500: < 2000ms

---

### Test 10: Error Handling

**Test Missing Authentication**:
```bash
curl -i http://localhost:5000/api/security/overview
# Expected: 401 Unauthorized
```

**Test Invalid Token**:
```bash
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:5000/api/security/overview
# Expected: 401 Unauthorized
```

**Test Invalid Date Format**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/security/threats?startDate=invalid"
# Expected: 400 Bad Request or invalid results
```

**Test Excessive Limit**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/security/threats?limit=1000"
# Expected: Limit capped at 500
```

---

## Database Verification Tests

### Test 11: Verify SiemDatasetRecord Index

```bash
mongosh mongodb://localhost:27017/mongodb

# Check indexes
db.siemdatasetrecords.getIndexes()

# Expected indexes:
# - _id_ (default)
# - dataset_1_config_1_split_1_rowIdx_1 (unique)
# - dataset_1_timestamp_1
# - dataset_1_severity_1_classification_1
```

**Verification Script**:
```bash
# Count records by severity
db.siemdatasetrecords.aggregate([
  {
    $group: {
      _id: "$severity",
      count: { $sum: 1 }
    }
  }
])

# Verify timestamps
db.siemdatasetrecords.find({}).sort({timestamp: -1}).limit(1).pretty()

# Verify geo-location data
db.siemdatasetrecords.find({
  "rawRecord.src_country": { $exists: true }
}).count()
```

---

### Test 12: Threat Count Validation

```javascript
// MongoDB: Verify threat counts match API

// Total threats last 7 days
db.siemdatasetrecords.countDocuments({
  timestamp: { $gte: new Date(Date.now() - 7*86400000) }
})

// Critical threats
db.siemdatasetrecords.countDocuments({
  timestamp: { $gte: new Date(Date.now() - 7*86400000) },
  severity: { $in: ["CRITICAL", "HIGH"] }
})

// Anomalies
db.siemdatasetrecords.countDocuments({
  timestamp: { $gte: new Date(Date.now() - 7*86400000) },
  isAnomaly: true
})

// By location
db.siemdatasetrecords.aggregate([
  { $match: { timestamp: { $gte: new Date(Date.now() - 86400000) } } },
  { 
    $group: { 
      _id: "$rawRecord.src_country", 
      count: { $sum: 1 } 
    } 
  },
  { $sort: { count: -1 } }
])
```

---

## Frontend Integration Tests

### Test 13: React Component Data Binding

**SecurityCenter.jsx**:
```javascript
// Verify state updates
console.log('Overview:', overview);
console.log('Attack Surface:', attackSurfaceData);
console.log('Policies:', securityPolicies);
console.log('Vulnerabilities:', vulnerabilities);

// Verify no undefined references
expect(overview?.protectionScore).toBeDefined();
expect(overview?.riskLevel).toBeDefined();
expect(attackSurfaceData.length).toBeGreaterThan(0);
expect(securityPolicies.length).toBe(4);
```

**ThreatMapModal.jsx**:
```javascript
// Verify threat data renders
console.log('Threat Map:', threatMap);
console.log('Filtered Threats:', filteredThreats);

// Verify SVG visualization
expect(document.querySelectorAll('circle').length).toBeGreaterThan(0);
expect(document.querySelectorAll('text').length).toBeGreaterThan(0);
```

---

## Postman Testing

### Import Postman Collection

Save as `security-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Security API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Overview",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/security/overview?days=7",
          "host": ["{{base_url}}"],
          "path": ["api", "security", "overview"],
          "query": [{"key": "days", "value": "7"}]
        }
      }
    },
    {
      "name": "Get Threats",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/security/threats?page=1&limit=50",
          "host": ["{{base_url}}"],
          "path": ["api", "security", "threats"],
          "query": [
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "50"}
          ]
        }
      }
    },
    {
      "name": "Get Threat Map",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/security/threat-map?days=1",
          "host": ["{{base_url}}"],
          "path": ["api", "security", "threat-map"],
          "query": [{"key": "days", "value": "1"}]
        }
      }
    }
  ]
}
```

---

## Monitoring & Logging

### Enable Request Logging

```javascript
// In backend security.js
router.use((req, res, next) => {
  console.log(`[Security API] ${req.method} ${req.path}`);
  console.log(`Params:`, req.query);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`Response: ${res.statusCode} (${duration}ms)`);
  });
  next();
});
```

### Monitor Database Queries

```bash
# Enable MongoDB logging
mongosh mongodb://localhost:27017/mongodb

# View current operations
db.currentOp()

# View slow queries (>100ms)
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ts:-1}).limit(5).pretty()
```

---

## Troubleshooting

### Issue: Empty threat data
**Solution**:
1. Verify SiemDatasetRecords exist: `db.siemdatasetrecords.count()`
2. Check timestamps are recent: `db.siemdatasetrecords.find().sort({timestamp:-1}).limit(1)`
3. Verify severity field exists: `db.siemdatasetrecords.find({severity:{$exists:true}}).count()`

### Issue: Wrong geo-locations
**Solution**:
1. Check rawRecord.src_country format
2. Verify country names match geoLocationMap in security.js
3. Sample query: `db.siemdatasetrecords.find({"rawRecord.src_country":{$exists:true}}).limit(1)`

### Issue: Slow threat-map response
**Solution**:
1. Verify aggregation indexes: `db.siemdatasetrecords.getIndexes()`
2. Check query execution: `db.siemdatasetrecords.find({timestamp:{$gte:new Date(Date.now()-86400000)}}).explain("executionStats")`

---

**Last Updated**: May 14, 2026  
**Version**: 1.0.0  
**Test Coverage**: 13 tests (unit + integration + database + frontend)
