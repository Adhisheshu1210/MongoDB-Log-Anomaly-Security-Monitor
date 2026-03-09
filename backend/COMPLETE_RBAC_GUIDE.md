/**
 * Complete RBAC Implementation & Error Handling Guide
 * MongoDB Log Anomaly & Security Monitor
 */

# Complete RBAC Implementation Guide

## Executive Summary

This document provides a **comprehensive overview** of the Role-Based Access Control (RBAC) implementation with complete error handling for the MongoDB Log Anomaly & Security Monitor. The system ensures secure, controlled access through three user roles: **Admin**, **User**, and **Viewer**, with granular permission management and detailed error responses.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [User Roles & Capabilities](#user-roles--capabilities)
3. [Permission System](#permission-system)
4. [Authentication Flow](#authentication-flow)
5. [Authorization Middleware](#authorization-middleware)
6. [Error Handling](#error-handling)
7. [Demo Data Operations](#demo-data-operations)
8. [Backup & Restore](#backup--restore)
9. [Implementation Patterns](#implementation-patterns)
10. [Testing Guide](#testing-guide)
11. [Security Best Practices](#security-best-practices)

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React/Vite)                  │
│  - Login Form                                               │
│  - Protected Pages (Dashboard, Logs, Alerts, Settings)      │
│  - Role-specific UI                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ JWT Token
                      ↓
┌─────────────────────────────────────────────────────────────┐
│             Authentication Middleware (auth.js)              │
│  - Token Verification (protect)                             │
│  - Role Authorization (authorize)                           │
│  - Permission Checking (checkPermission)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ req.user attached
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Route Handlers (API Endpoints)                  │
│  - /api/settings/backup      (admin only)                   │
│  - /api/settings/restore     (admin only)                   │
│  - /api/settings/demo        (admin only)                   │
│  - /api/settings/clear-demo  (admin only)                   │
│  - /api/logs                 (all authenticated)            │
│  - /api/anomalies            (all authenticated)            │
└─────────────────────┬───────────────────────────────────────┘
                      │ RBAC checks
                      ↓
┌─────────────────────────────────────────────────────────────┐
│            RBAC Service (rbacService.js)                     │
│  - Permission Validation                                    │
│  - Role Capability Management                              │
│  - Authorization Decisions                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Database Operations                             │
│  - MongoDB Models (User, Settings, Logs, etc.)             │
│  - Secure Queries                                           │
│  - Audit Logging                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## User Roles & Capabilities

### 1. Admin Role

**PURPOSE**: System administrator with complete control

**CAPABILITIES**:
```
✓ Create, read, update, delete all resources
✓ Manage user accounts and roles
✓ Configure all system settings
  - Alert thresholds
  - Notification channels
  - Anomaly detection algorithms
  - Security policies
✓ Generate and clear demo data
✓ Backup and restore settings
✓ View audit logs and security reports
✓ Access all dashboards and metrics
```

**API ACCESS**:
- All endpoints without restrictions
- All HTTP methods (GET, POST, PUT, DELETE)
- All data including sensitive configurations

**EXAMPLE USER**:
```
Email: admin@example.com
Password: admin123
Role: admin
Permissions: All 30+
```

---

### 2. User Role (DevOps Member)

**PURPOSE**: Team member who monitors and responds to alerts

**CAPABILITIES**:
```
✓ View all logs, anomalies, and alerts
✓ Acknowledge and resolve alerts
✓ Investigate anomalies
✓ View system metrics and dashboards
✓ Access read-only audit logs
✗ Cannot modify configurations
✗ Cannot manage users
✗ Cannot backup/restore settings
✗ Cannot generate/clear demo data
```

**API ACCESS**:
- Read-only to logs, anomalies, alerts, metrics
- Can acknowledge/resolve alerts (PUT)
- Can resolve anomalies (PUT)
- Cannot access admin endpoints

**EXAMPLE USER**:
```
Email: user@example.com
Password: admin123
Role: user
Permissions: ~15
```

---

### 3. Viewer Role

**PURPOSE**: Read-only access for monitoring

**CAPABILITIES**:
```
✓ View logs (read-only)
✓ View anomalies (read-only)
✓ View alerts (read-only)
✓ View system metrics
✓ Acknowledge alerts (view status change)
✗ Cannot resolve alerts
✗ Cannot modify anything
✗ Cannot access configurations
```

**API ACCESS**:
- GET only for most endpoints
- Can only acknowledge (not resolve)
- No write access to any resource

**EXAMPLE USER**:
```
Email: viewer@example.com
Password: admin123
Role: viewer
Permissions: ~8
```

---

## Permission System

### Complete Permission List

```javascript
// Permissions organized by resource:

LOGS PERMISSIONS
├── logs:read           [admin, user, viewer]
├── logs:filter         [admin, user, viewer]
└── logs:export         [admin, user]

ANOMALIES PERMISSIONS
├── anomalies:read      [admin, user, viewer]
├── anomalies:resolve   [admin, user]
└── anomalies:acknowledge [admin, user, viewer]

ALERTS PERMISSIONS
├── alerts:read         [admin, user, viewer]
├── alerts:acknowledge  [admin, user, viewer]
└── alerts:resolve      [admin, user]

SETTINGS PERMISSIONS
├── settings:read       [admin, user, viewer]
├── settings:write      [admin]
├── settings:backup     [admin]
└── settings:restore    [admin]

CONFIGURATION PERMISSIONS
├── config:alerts       [admin]
├── config:notifications [admin]
├── config:anomaly      [admin]
└── config:security     [admin]

USER MANAGEMENT PERMISSIONS
├── users:read          [admin]
├── users:create        [admin]
├── users:update        [admin]
├── users:delete        [admin]
└── users:manage-roles  [admin]

SYSTEM PERMISSIONS
├── system:health       [admin, user, viewer]
├── system:metrics      [admin, user, viewer]
└── system:admin-panel  [admin]

DEMO DATA PERMISSIONS
├── demo:generate       [admin]
└── demo:clear          [admin]

AUDIT PERMISSIONS
├── audit:read          [admin]
└── audit:export        [admin]
```

---

## Authentication Flow

### Step-by-Step Process

```
1. USER LOGIN
   ↓
   POST /api/auth/login
   {
     "email": "admin@example.com",
     "password": "admin123"
   }

2. CREDENTIAL VERIFICATION
   ↓
   - Fetch user from database by email
   - Compare password with bcrypt hash
   - Verify user is active (isActive: true)

3. TOKEN GENERATION
   ↓
   jwt.sign(
     { id: userId },
     JWT_SECRET,
     { expiresIn: '7d' }
   )

4. RESPONSE
   ↓
   {
     "success": true,
     "data": {
       "token": "eyJhbGc...",
       "user": {
         "_id": "...",
         "username": "admin",
         "email": "admin@example.com",
         "role": "admin"
       }
     }
   }

5. CLIENT STORES TOKEN
   ↓
   localStorage.setItem('token', token)

6. SUBSEQUENT REQUESTS
   ↓
   GET /api/logs
   Headers: {
     "Authorization": "Bearer eyJhbGc..."
   }

7. MIDDLEWARE VERIFICATION
   ↓
   protect middleware:
   - Extract token from header
   - jwt.verify(token, JWT_SECRET)
   - Fetch user from database
   - Check isActive status
   - Attach user to req

8. AUTHORIZATION CHECK
   ↓
   authorize('admin', 'user') middleware:
   - Check req.user.role in allowed roles
   - Allow or deny request

9. RBAC VALIDATION (Optional)
   ↓
   checkPermission('logs:read') middleware:
   - Check rbacService.isActionAllowed()
   - Verify specific permission

10. REQUEST PROCESSING
    ↓
    Handler executes with req.user context
    Returns response with appropriate data
```

---

## Authorization Middleware

### Middleware Usage Patterns

#### 1. Basic Authentication Only
```javascript
// Allow any authenticated user
router.get('/api/logs', protect, handler);

// req.user is available in handler
// No role restrictions
```

#### 2. Role-Based Authorization
```javascript
// Admin only
router.post('/api/settings', protect, authorize('admin'), handler);

// Multiple roles allowed
router.get('/api/alerts', protect, authorize('admin', 'user'), handler);

// Convenience: admin only
router.post('/api/users', protect, isAdmin, handler);
```

#### 3. Permission-Based Authorization
```javascript
// Single permission
router.get('/api/backup', protect, checkPermission('settings:backup'), handler);

// Multiple permissions (user needs at least one)
router.get('/api/reports', protect, checkAnyPermission('audit:read', 'report:view'), handler);

// Multiple permissions (user needs all)
router.delete('/api/users/:id', protect, checkAllPermissions('users:read', 'users:delete'), handler);
```

#### 4. Combination Middleware
```javascript
// Role + Permission
router.post('/api/anomalies/batch-resolve',
  protect,
  authorize('admin', 'user'),
  checkPermission('anomalies:resolve'),
  handler
);

// Custom logic
router.put('/api/user/:id',
  protect,
  customAuth((req) => {
    return req.user.role === 'admin' || req.user._id.equals(req.params.id);
  }),
  handler
);
```

---

## Error Handling

### 1. Authentication Errors (401)

#### No Token Provided
```
REQUEST:
GET /api/logs
(no Authorization header)

RESPONSE:
HTTP 401 Unauthorized
{
  "success": false,
  "message": "Not authorized to access this route",
  "details": "No authentication token provided. Include token in Authorization header: Bearer <token>",
  "code": "NO_TOKEN"
}
```

#### Token Expired
```
REQUEST:
GET /api/logs
Authorization: Bearer eyJhbGc...  (expired)

RESPONSE:
HTTP 401 Unauthorized
{
  "success": false,
  "message": "Token has expired",
  "details": "Please login again to get a new token",
  "code": "TOKEN_EXPIRED",
  "expiredAt": "2024-03-09T10:30:00Z"
}
```

#### Token Invalid
```
REQUEST:
GET /api/logs
Authorization: Bearer invalid.token.here

RESPONSE:
HTTP 401 Unauthorized
{
  "success": false,
  "message": "Invalid token",
  "details": "The provided token is malformed or cannot be verified",
  "code": "INVALID_TOKEN"
}
```

#### User Not Found
```
RESPONSE:
HTTP 401 Unauthorized
{
  "success": false,
  "message": "User not found",
  "details": "The user associated with this token no longer exists",
  "code": "USER_NOT_FOUND"
}
```

#### Account Disabled
```
RESPONSE:
HTTP 401 Unauthorized
{
  "success": false,
  "message": "User account is disabled",
  "details": "Contact administrator to reactivate your account",
  "code": "ACCOUNT_DISABLED"
}
```

---

### 2. Authorization Errors (403)

#### Insufficient Role
```
REQUEST:
POST /api/settings/demo
User: viewer
Role: viewer

RESPONSE:
HTTP 403 Forbidden
{
  "success": false,
  "message": "Role 'viewer' is not authorized to access this route",
  "details": "Only users with the following roles are allowed: admin",
  "code": "INSUFFICIENT_ROLE",
  "requiredRoles": ["admin"],
  "userRole": "viewer"
}
```

#### Insufficient Permission
```
REQUEST:
POST /api/settings/demo
User: user
Role: user
Permission Required: demo:generate (admin only)

RESPONSE:
HTTP 403 Forbidden
{
  "success": false,
  "message": "Role 'user' is not authorized to perform action 'demo:generate'. Required roles: admin",
  "code": "INSUFFICIENT_PERMISSION",
  "requiredPermission": "demo:generate",
  "userRole": "user"
}
```

---

### 3. Validation Errors (400)

#### Invalid Backup Format
```
REQUEST:
POST /api/settings/restore
{
  "backup": {
    "version": "2.0.0",
    "invalid_key": "..."
  }
}

RESPONSE:
HTTP 400 Bad Request
{
  "success": false,
  "message": "Invalid backup file format",
  "details": "Backup must contain a settings object with key-value pairs",
  "code": "INVALID_BACKUP",
  "providedFields": ["version", "invalid_key"]
}
```

#### Incompatible Backup Version
```
REQUEST:
POST /api/settings/restore
{
  "backup": {
    "version": "2.5.0",
    "settings": {...}
  }
}

RESPONSE:
HTTP 400 Bad Request
{
  "success": false,
  "message": "Incompatible backup version: 2.5.0. This system requires version 1.x",
  "details": "The backup file may be from a different version of the system.",
  "code": "VERSION_MISMATCH"
}
```

#### Invalid Demo Data Parameters
```
REQUEST:
POST /api/settings/demo
{
  "logsCount": 50000,  // Invalid: max is 10000
  "anomaliesCount": 24,
  "alertsCount": 12
}

RESPONSE:
HTTP 400 Bad Request
{
  "success": false,
  "message": "Invalid logsCount parameter",
  "details": "logsCount must be between 1 and 10000",
  "code": "VALIDATION_ERROR"
}
```

---

### 4. Server Errors (500)

#### Demo Generation Failure
```
REQUEST:
POST /api/settings/demo
{
  "logsCount": 100,
  "anomaliesCount": 20,
  "alertsCount": 10
}

RESPONSE:
HTTP 500 Internal Server Error
{
  "success": false,
  "message": "Failed to generate demo data",
  "details": "Insert operation failed: duplicate key error for Log.timestamp",
  "code": "GENERATION_ERROR",
  "error": "E11000 duplicate key error..."  // Only in development
}
```

#### Demo Clear Failure
```
REQUEST:
POST /api/settings/clear-demo

RESPONSE:
HTTP 500 Internal Server Error
{
  "success": false,
  "message": "Failed to clear demo data",
  "details": "Failed to delete demo logs: connection timeout",
  "code": "CLEAR_ERROR"
}
```

#### Backup Failure
```
RESPONSE:
HTTP 500 Internal Server Error
{
  "success": false,
  "message": "Failed to backup settings",
  "details": "Database query timeout",
  "code": "BACKUP_ERROR"
}
```

#### Restore Failure (Partial)
```
RESPONSE:
HTTP 200 OK (Success with warnings)
{
  "success": true,
  "message": "Settings restored successfully: 35 created, 5 updated, 2 failed",
  "results": {
    "created": 35,
    "updated": 5,
    "failed": 2,
    "errors": [
      {
        "key": "badSetting1",
        "error": "Update failed: invalid category value"
      },
      {
        "key": "badSetting2",
        "error": "Creation failed: validation error"
      }
    ]
  },
  "data": [...]
}
```

---

## Demo Data Operations

### Generate Demo Data

**ENDPOINT**: `POST /api/settings/demo`
**AUTHENTICATION**: Required (Admin only)
**PERMISSION**: `demo:generate`

**REQUEST**:
```bash
curl -X POST http://localhost:5000/api/settings/demo \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "logsCount": 100,
    "anomaliesCount": 20,
    "alertsCount": 10
  }'
```

**PARAMETERS**:
```javascript
{
  logsCount:      number,  // 1-10000, default: 120
  anomaliesCount: number,  // 1-5000, default: 24
  alertsCount:    number   // 1-5000, default: 12
}
```

**SUCCESS RESPONSE** (200):
```json
{
  "success": true,
  "message": "Demo data generated successfully: 100 logs, 20 anomalies, 10 alerts",
  "data": {
    "logsGenerated": 100,
    "anomaliesGenerated": 20,
    "alertsGenerated": 10,
    "totals": {
      "logs": 240,
      "anomalies": 47,
      "alerts": 24
    }
  }
}
```

**VALIDATION**:
- ✓ logsCount: 1-10000
- ✓ anomaliesCount: 1-5000
- ✓ alertsCount: 1-5000
- ✗ Negative values
- ✗ Non-integer values
- ✗ Exceeding limits

**AUDIT LOG**:
```javascript
{
  userId: "...",
  username: "admin",
  action: "generate_demo",
  resource: "demo_data",
  timestamp: ISODate(...),
  status: "success",
  details: {
    logs: 100,
    anomalies: 20,
    alerts: 10
  }
}
```

---

### Clear Demo Data

**ENDPOINT**: `POST /api/settings/clear-demo`
**AUTHENTICATION**: Required (Admin only)
**PERMISSION**: `demo:clear`

**REQUEST**:
```bash
curl -X POST http://localhost:5000/api/settings/clear-demo \
  -H "Authorization: Bearer eyJhbGc..."
```

**SUCCESS RESPONSE** (200):
```json
{
  "success": true,
  "message": "Demo data cleared successfully: 120 logs, 24 anomalies, 12 alerts deleted",
  "data": {
    "logsDeleted": 120,
    "anomaliesDeleted": 24,
    "alertsDeleted": 12,
    "totalDeleted": 156
  }
}
```

**NO DATA RESPONSE** (200):
```json
{
  "success": true,
  "message": "No demo data found to clear",
  "data": {
    "logsDeleted": 0,
    "anomaliesDeleted": 0,
    "alertsDeleted": 0,
    "totalDeleted": 0
  }
}
```

**ERROR RESPONSE** (500):
```json
{
  "success": false,
  "message": "Failed to clear demo data",
  "details": "Failed to delete demo logs: connection timeout",
  "code": "CLEAR_ERROR"
}
```

---

## Backup & Restore

### Backup Settings

**ENDPOINT**: `GET /api/settings/backup`
**AUTHENTICATION**: Required (Admin only)
**PERMISSION**: `settings:backup`

**REQUEST**:
```bash
curl -X GET http://localhost:5000/api/settings/backup \
  -H "Authorization: Bearer eyJhbGc..."
```

**SUCCESS RESPONSE** (200):
```json
{
  "success": true,
  "message": "Settings backup created with 42 items",
  "data": {
    "version": "1.0.0",
    "timestamp": "2024-03-08T10:30:00Z",
    "exportedBy": "admin",
    "totalSettings": 42,
    "settings": {
      "alertThresholds": {
        "value": { "slowQueryMs": 5000, ... },
        "category": "alert-thresholds",
        "description": "Alert threshold configuration",
        "isPublic": false
      },
      "notificationSettings": { ... },
      ...
    }
  }
}
```

**ERROR RESPONSE - No Settings** (400):
```json
{
  "success": false,
  "message": "No settings found to backup",
  "code": "NO_SETTINGS"
}
```

---

### Restore Settings

**ENDPOINT**: `POST /api/settings/restore`
**AUTHENTICATION**: Required (Admin only)
**PERMISSION**: `settings:restore`

**REQUEST**:
```bash
curl -X POST http://localhost:5000/api/settings/restore \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '@backup.json'
```

**BACKUP FILE FORMAT** (`backup.json`):
```json
{
  "version": "1.0.0",
  "timestamp": "2024-03-08T10:30:00Z",
  "exportedBy": "admin",
  "totalSettings": 42,
  "settings": {
    "alertThresholds": {
      "value": { "slowQueryMs": 5000 },
      "category": "alert-thresholds",
      "description": "...",
      "isPublic": false
    }
  }
}
```

**SUCCESS RESPONSE** (200):
```json
{
  "success": true,
  "message": "Settings restored successfully: 10 created, 32 updated",
  "results": {
    "created": 10,
    "updated": 32,
    "failed": 0,
    "errors": []
  },
  "data": [...]
}
```

**PARTIAL FAILURE RESPONSE** (200):
```json
{
  "success": true,
  "message": "Settings restored successfully: 10 created, 30 updated, 2 failed",
  "results": {
    "created": 10,
    "updated": 30,
    "failed": 2,
    "errors": [
      {
        "key": "invalidSetting",
        "error": "Update failed: invalid enum value"
      }
    ]
  },
  "data": [...]
}
```

**ERROR RESPONSE - No Backup Data** (400):
```json
{
  "success": false,
  "message": "No backup data provided. Please provide a valid backup JSON object.",
  "details": "Expected format: { version, timestamp, settings: {...} }",
  "code": "NO_BACKUP"
}
```

**ERROR RESPONSE - Invalid Format** (400):
```json
{
  "success": false,
  "message": "Invalid backup file format",
  "details": "Backup must contain a settings object with key-value pairs",
  "code": "INVALID_BACKUP",
  "providedFields": ["version", "timestamp", "data"]
}
```

**ERROR RESPONSE - Version Mismatch** (400):
```json
{
  "success": false,
  "message": "Incompatible backup version: 2.0.0. This system requires version 1.x",
  "details": "The backup file may be from a different version of the system.",
  "code": "VERSION_MISMATCH"
}
```

---

## Implementation Patterns

### Pattern 1: Simple Role-Based Route
```javascript
router.get('/api/admin-panel', protect, authorize('admin'), async (req, res) => {
  try {
    // Only admins reach here
    const data = await getAdminData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Pattern 2: Multi-Role Route
```javascript
router.get('/api/alerts', protect, authorize('admin', 'user', 'viewer'), async (req, res) => {
  try {
    let query = {};
    // Filter by role
    if (req.user.role === 'viewer') {
      query.isPublic = true;  // Viewers see only public alerts
    }
    const alerts = await Alert.find(query);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Pattern 3: Permission-Based Route
```javascript
router.post('/api/backup', protect, checkPermission('settings:backup'), async (req, res) => {
  try {
    const backup = await generateBackup();
    
    // Audit log
    await securityService.auditLog(req.user._id, 'backup', 'settings');
    
    res.json({ success: true, data: backup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Pattern 4: Custom Authorization Logic
```javascript
router.put('/api/profile/:userId', protect, async (req, res) => {
  try {
    // Users can only update their own profile
    // Admins can update anyone's profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Pattern 5: Data Filtering by Role
```javascript
router.get('/api/users', protect, authorize('admin'), async (req, res) => {
  try {
    let users = await User.find();

    // Admins see all users with all fields
    if (req.user.role === 'admin') {
      return res.json({ success: true, data: users });
    }

    // Other roles (shouldn't reach here due to authorize middleware)
    // but included for safety
    users = users.filter(u => u.role !== 'admin');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## Testing Guide

### Setup Test Environment

```bash
# 1. Start MongoDB
mongod

# 2. Start Backend
npm run dev

# 3. Create test file: test-rbac.js
```

### Test Script

```javascript
// test-rbac.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const credentials = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  user: { email: 'user@example.com', password: 'admin123' },
  viewer: { email: 'viewer@example.com', password: 'admin123' }
};

let tokens = {};

// Login
async function loginAsRole(role) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials[role]);
    tokens[role] = response.data.data.token;
    console.log(`✓ Logged in as ${role}`);
  } catch (error) {
    console.error(`✗ Failed to login as ${role}`);
  }
}

// Test endpoint access
async function testEndpoint(role, method, endpoint) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${tokens[role]}` }
    };
    
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      ...config
    });

    console.log(`✓ ${role} ${method} ${endpoint}: SUCCESS`);
    return true;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.log(`✗ ${role} ${method} ${endpoint}: ${status} - ${message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('\n=== RBAC TESTING ===\n');

  // Login
  for (let role of ['admin', 'user', 'viewer']) {
    await loginAsRole(role);
  }

  console.log('\n--- BACKUP ENDPOINT (admin only) ---');
  await testEndpoint('admin', 'GET', '/settings/backup');
  await testEndpoint('user', 'GET', '/settings/backup');
  await testEndpoint('viewer', 'GET', '/settings/backup');

  console.log('\n--- DEMO ENDPOINT (admin only) ---');
  await testEndpoint('admin', 'POST', '/settings/demo');
  await testEndpoint('user', 'POST', '/settings/demo');
  await testEndpoint('viewer', 'POST', '/settings/demo');

  console.log('\n--- LOGS ENDPOINT (all) ---');
  await testEndpoint('admin', 'GET', '/logs');
  await testEndpoint('user', 'GET', '/logs');
  await testEndpoint('viewer', 'GET', '/logs');

  console.log('\n=== TEST COMPLETE ===\n');
}

runTests();
```

### Run Tests

```bash
node test-rbac.js
```

---

## Security Best Practices

### 1. Password Security
- ✓ Hash with bcryptjs (10+ salt rounds)
- ✓ Never store plain text
- ✓ Validate strength (8+ chars, upper, lower, number)
- ✓ Support password reset flow
- ✓ Enforce MFA when enabled

### 2. Token Management
- ✓ Tokens expire after 7 days
- ✓ Refresh token rotation
- ✓ Token blacklisting for logout
- ✓ Secure token storage (httpOnly cookie or localStorage)
- ✓ Token validation on every request

### 3. Account Security
- ✓ Track login attempts (IP, timestamp, success)
- ✓ Auto-lock after N failed attempts (default: 5)
- ✓ Log failed attempts for audit
- ✓ Require password change after N days
- ✓ Account recovery flow

### 4. Permission Checking
- ✓ Check permissions on every protected route
- ✓ Don't rely on client-side role display
- ✓ Validate both role AND permission when needed
- ✓ Use specific permissions instead of generic roles
- ✓ Implement least privilege principle

### 5. Audit Logging
- ✓ Log all sensitive operations
- ✓ Include timestamp, user, action, resource
- ✓ Store failures separately for investigation
- ✓ Retain logs for compliance period
- ✓ Alert on suspicious patterns

### 6. Data Protection
- ✓ Encrypt sensitive fields
- ✓ Use select: false for passwords/secrets
- ✓ Filter data by user role
- ✓ Validate all inputs
- ✓ Implement rate limiting

### 7. Development Security
- ✓ Never expose sensitive errors to users
- ✓ Log full errors only in development
- ✓ Use environment variables for secrets
- ✓ Don't commit secrets to repos
- ✓ Rotate secrets regularly

---

## Summary

This RBAC implementation provides:

✅ **Three User Roles**
- Admin: Full control
- User: Limited operational access
- Viewer: Read-only access

✅ **30+ Granular Permissions**
- Fine-grained control over resources
- Flexible authorization checks
- Role-specific capabilities

✅ **Comprehensive Error Handling**
- Descriptive error messages
- Error codes for programmatic handling
- Detailed validation feedback
- Development vs. production modes

✅ **Complete Operation Support**
- Demo data generation & clearing
- Settings backup & restore
- Audit logging of all operations
- User-friendly feedback

✅ **Security Best Practices**
- Password hashing & validation
- Token expiration & verification
- Login attempt tracking
- Audit trail logging
- Principle of least privilege

---

## Files & References

| File | Purpose |
|------|---------|
| `src/middleware/auth.js` | Authentication & authorization middleware |
| `src/middleware/auth-enhanced.js` | Extended auth with advanced features |
| `src/services/rbacService.js` | Permission management service |
| `src/routes/settings.js` | Settings API with error handling |
| `src/models/User.js` | User schema with security fields |
| `RBAC_IMPLEMENTATION.md` | This document |
| `BACKEND_SERVICES.md` | Service architecture |

---

*Document Version: 1.0.0*
*Last Updated: March 8, 2026*
*Status: Complete & Production Ready*
