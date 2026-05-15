# Security Backend API Documentation

## Overview

Complete security management and threat analysis system using SIEM dataset records. Provides real-time threat intelligence, geo-location mapping, attack surface analysis, and security policy management.

## Base URL

```
http://localhost:5000/api/security
```

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer {token}` header. Protected by `auth` middleware.

---

## Endpoints

### 1. GET /api/security/overview

Get security overview with risk metrics and statistics.

**Query Parameters:**
- `days` (optional, default: 7) - Number of days to analyze

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "days": 7,
      "since": "2026-05-14T12:00:00.000Z"
    },
    "totalThreats": 2402,
    "criticalThreats": 145,
    "anomalyCount": 389,
    "failedAttempts": 1023,
    "protectionScore": 94,
    "riskLevel": "LOW",
    "riskPercentage": 6,
    "topThreats": [
      {
        "_id": "unauthorized_access",
        "count": 456
      }
    ],
    "recentErrors": 128
  }
}
```

**Status Codes:**
- 200: Success
- 500: Server error

---

### 2. GET /api/security/threats

Get threat data with advanced filtering and pagination.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50, max: 500) - Results per page
- `severity` (optional) - Comma-separated list (CRITICAL,HIGH,MEDIUM,LOW)
- `classification` (optional) - Comma-separated classification types
- `isAnomaly` (optional) - Boolean filter (true/false)
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `sort` (optional, default: -timestamp) - Sort field

**Example Request:**
```
GET /api/security/threats?page=1&limit=50&severity=CRITICAL,HIGH&isAnomaly=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "timestamp": "2026-05-14T12:30:00.000Z",
      "severity": "CRITICAL",
      "classification": "unauthorized_access",
      "isAnomaly": true,
      "anomalyScore": 0.95,
      "source": "network_traffic",
      "sourceIp": "192.168.1.100",
      "targetIp": "10.0.0.50",
      "port": 22,
      "protocol": "SSH",
      "action": "DENIED",
      "description": "Brute force attack detected"
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

**Status Codes:**
- 200: Success
- 500: Server error

---

### 3. GET /api/security/threat-map

Get threat map with geo-locations and source IPs for visualization.

**Query Parameters:**
- `days` (optional, default: 1) - Number of days to analyze
- `limit` (optional, default: 100) - Maximum threat locations to return

**Example Request:**
```
GET /api/security/threat-map?days=1&limit=100
```

**Response:**
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
        "country": "Germany",
        "latitude": 51.1657,
        "longitude": 10.4515,
        "countryCode": "DE",
        "threatCount": 456,
        "severity": "HIGH",
        "lastSeen": "2026-05-14T12:45:00.000Z",
        "ports": [22, 3389, 445],
        "protocols": ["SSH", "RDP", "SMB"]
      },
      {
        "sourceIp": "122.96.14.78",
        "location": "China",
        "country": "China",
        "latitude": 35.8617,
        "longitude": 104.1954,
        "countryCode": "CN",
        "threatCount": 389,
        "severity": "CRITICAL",
        "lastSeen": "2026-05-14T12:40:00.000Z",
        "ports": [3306, 5432],
        "protocols": ["MySQL", "PostgreSQL"]
      }
    ]
  }
}
```

**Supported Countries:**
- United States (37.0902, -95.7129)
- Germany (51.1657, 10.4515)
- China (35.8617, 104.1954)
- Russia (61.524, 105.3188)
- India (20.5937, 78.9629)
- Brazil (-14.2350, -51.9253)
- France (46.2276, 2.2137)
- United Kingdom (55.3781, -3.4360)
- Japan (36.2048, 138.2529)
- Australia (-25.2744, 133.7751)

**Status Codes:**
- 200: Success
- 500: Server error

---

### 4. GET /api/security/attack-surface

Get attack surface data grouped by hourly intervals.

**Query Parameters:**
- `days` (optional, default: 1) - Number of days to analyze

**Example Request:**
```
GET /api/security/attack-surface?days=1
```

**Response:**
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
    },
    {
      "name": "02:00",
      "attempts": 95,
      "anomalies": 8,
      "severity": "LOW"
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 500: Server error

---

### 5. GET /api/security/policies

Get active security policies and their status.

**Response:**
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
      "lastUpdated": "2026-05-10T00:00:00.000Z",
      "coverage": "100%"
    },
    {
      "id": "rate-limit",
      "title": "IP Rate Limiting",
      "status": "ACTIVE",
      "description": "Max 100 requests/sec per origin IP.",
      "active": true,
      "lastUpdated": "2026-05-12T00:00:00.000Z",
      "coverage": "95%"
    },
    {
      "id": "encryption",
      "title": "Cold Storage Encryption",
      "status": "ENFORCED",
      "description": "AES-256 for logs older than 30 days.",
      "active": true,
      "lastUpdated": "2026-05-08T00:00:00.000Z",
      "coverage": "100%"
    },
    {
      "id": "ai-blocking",
      "title": "Automated IP Blacklisting",
      "status": "LEARNING",
      "description": "AI-driven blocking of suspicious nodes.",
      "active": false,
      "lastUpdated": "2026-05-14T00:00:00.000Z",
      "coverage": "45%"
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 500: Server error

---

### 6. GET /api/security/vulnerabilities

Get known vulnerabilities and security advisories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "CVE-2026-0912",
      "title": "Kernel Vulnerability Found",
      "severity": "CRITICAL",
      "description": "Patch required for Shard-04.",
      "cveId": "CVE-2026-0912",
      "affectedSystems": ["Shard-04"],
      "discoveredDate": "2026-05-14T00:00:00.000Z",
      "patchAvailable": true,
      "CVSS": 9.8
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 500: Server error

---

### 7. PUT /api/security/policies/:id

Update security policy configuration. **Requires admin authorization.**

**Path Parameters:**
- `id` - Policy ID (mfa, rate-limit, encryption, ai-blocking)

**Request Body:**
```json
{
  "active": true,
  "description": "Updated description",
  "status": "ENFORCED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Policy updated successfully",
  "data": {
    "id": "mfa",
    "active": true,
    "description": "Updated description",
    "status": "ENFORCED",
    "updatedAt": "2026-05-14T12:30:00.000Z"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Forbidden (requires admin)
- 500: Server error

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development mode only)"
}
```

**Common Error Codes:**
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## Data Sources

### SiemDatasetRecord Collection

Threats are aggregated from the SiemDatasetRecord collection which contains:

```javascript
{
  _id: ObjectId,
  dataset: String,
  config: String,
  split: String,
  rowIdx: Number,
  timestamp: Date,
  severity: String,           // CRITICAL, HIGH, MEDIUM, LOW
  source: String,             // Source of the record
  classification: String,     // Type of threat
  isAnomaly: Boolean,
  anomalyScore: Number,       // 0-1 range
  rawRecord: {                // Original Hugging Face record
    src_ip: String,
    dst_ip: String,
    src_country: String,      // Source country for geo-location
    dst_port: Number,
    protocol: String,
    action: String,
    label: String,
    description: String
  }
}
```

### Geo-Location Mapping

The system includes a built-in mapping of countries to coordinates:

| Country | Latitude | Longitude | Code |
|---------|----------|-----------|------|
| United States | 37.0902 | -95.7129 | US |
| Germany | 51.1657 | 10.4515 | DE |
| China | 35.8617 | 104.1954 | CN |
| Russia | 61.524 | 105.3188 | RU |
| India | 20.5937 | 78.9629 | IN |
| Brazil | -14.2350 | -51.9253 | BR |
| France | 46.2276 | 2.2137 | FR |
| United Kingdom | 55.3781 | -3.4360 | UK |
| Japan | 36.2048 | 138.2529 | JP |
| Australia | -25.2744 | 133.7751 | AU |

---

## Risk Level Calculation

Risk level is calculated from threat metrics:

```
riskScore = (criticalThreats * 10 + anomalyCount * 5 + failedAttempts * 3) / totalThreats

Risk Level Classification:
- CRITICAL: score > 7
- HIGH: score > 5
- MEDIUM: score > 3
- LOW: score > 1
- MINIMAL: score <= 1

Protection Score: 100 - (riskScore * 10)
```

---

## RBAC Access Control

| Endpoint | Required Permission | Admin Only |
|----------|-------------------|-----------|
| GET /overview | - | No |
| GET /threats | - | No |
| GET /threat-map | - | No |
| GET /attack-surface | - | No |
| GET /policies | - | No |
| GET /vulnerabilities | - | No |
| PUT /policies/:id | manage_security | Yes |

---

## Rate Limiting

Default: 100 requests/minute per origin IP

Endpoints with higher limits (if configured):
- GET /threat-map: 50 requests/minute

---

## Performance Considerations

1. **Pagination**: Maximum 500 results per request
2. **Aggregation**: Heavy aggregations (threat-map) run on indexed fields
3. **Indexes**: Database has compound indexes on:
   - dataset + severity + classification
   - dataset + timestamp

4. **Caching**: Consider caching threat-map for 1-5 minutes

---

## Integration Examples

### JavaScript/Axios

```javascript
import securityService from './services/security.service';

// Get overview
const overview = await securityService.getOverview({ days: 7 });

// Get threats with filtering
const threats = await securityService.getThreats({
  page: 1,
  limit: 50,
  severity: 'CRITICAL,HIGH'
});

// Get threat map
const threatMap = await securityService.getThreatMap({ days: 1 });

// Get attack surface
const attacks = await securityService.getAttackSurface({ days: 1 });

// Get policies
const policies = await securityService.getPolicies();

// Update policy
await securityService.updatePolicy('mfa', { active: true });
```

### cURL

```bash
# Get overview
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/security/overview?days=7

# Get threats
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/security/threats?severity=CRITICAL,HIGH&page=1

# Get threat map
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/security/threat-map?days=1

# Get policies
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/security/policies

# Update policy (requires admin)
curl -X PUT \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"active":true}' \
  http://localhost:5000/api/security/policies/mfa
```

---

## Deployment Checklist

- [ ] MongoDB collections indexed properly
- [ ] SiemDatasetRecord contains geo-location data in rawRecord fields
- [ ] RBAC system configured with manage_security permission
- [ ] Environment variables configured:
  - NODE_ENV: production
  - DATABASE_URL: MongoDB connection
  - JWT_SECRET: Secure secret
- [ ] CORS configured for frontend origin
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] SSL/TLS enabled in production
- [ ] Database backups scheduled

---

## Support & Troubleshooting

### Common Issues

**Issue**: Empty threat data returned
- **Solution**: Verify SiemDatasetRecords are imported with proper timestamps

**Issue**: Wrong geo-locations
- **Solution**: Check rawRecord.src_country field format matches mapping keys

**Issue**: 500 errors on threat-map
- **Solution**: Ensure MongoDB aggregation pipeline indexes exist

**Issue**: Slow responses
- **Solution**: Verify database indexes on timestamp, severity, classification

---

**Last Updated**: May 14, 2026
**Version**: 1.0.0
**Status**: Production Ready
