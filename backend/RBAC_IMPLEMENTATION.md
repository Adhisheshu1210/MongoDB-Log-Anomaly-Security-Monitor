/**
 * Role-Based Access Control (RBAC) Implementation
 * Complete Guide & Documentation
 */

# Role-Based Access Control (RBAC) System

## Overview

This MongoDB Log Anomaly & Security Monitor implements a **comprehensive Role-Based Access Control (RBAC)** system to ensure secure and controlled access to the monitoring platform. The system uses JWT authentication and role-based permission checking to manage user access.

---

## 1. User Roles

### 1.1 Admin Role
**Description**: Administrator with full system access

**Capabilities**:
- ✅ View all logs and anomalies
- ✅ Configure alert thresholds
- ✅ Manage notification settings (Email, Slack, Telegram)
- ✅ Manage users and roles
- ✅ Access system health metrics and dashboards
- ✅ Generate and clear demo data
- ✅ Backup and restore settings
- ✅ Access audit logs and security reports
- ✅ Configure anomaly detection algorithms
- ✅ Manage security policies

**API Access**:
- Can access all endpoints
- Can perform GET, POST, PUT, DELETE operations on protected resources
- Can view sensitive configuration data
- Can perform system-wide operations

### 1.2 User Role (DevOps Member)
**Description**: Regular user with limited access for monitoring

**Capabilities**:
- ✅ View logs and anomaly alerts
- ✅ Monitor system dashboard
- ✅ Check performance metrics
- ✅ Acknowledge alerts
- ✅ Resolve anomalies
- ✅ Access audit logs (read-only)

**API Access**:
- Can read most resources
- Can acknowledge/resolve anomalies and alerts
- Cannot modify configurations
- Cannot manage users
- Cannot view sensitive settings

### 1.3 Viewer Role
**Description**: Read-only access for monitoring

**Capabilities**:
- ✅ View logs (read-only)
- ✅ View anomalies (read-only)
- ✅ View alerts (read-only)
- ✅ View system metrics (read-only)
- ✅ Acknowledge alerts only

**API Access**:
- Can only read public resources
- Can acknowledge alerts
- Cannot modify any data
- Cannot view admin-only settings

---

## 2. Permission System

### 2.1 Defined Permissions

```javascript
// Log permissions
'logs:read'        -> [admin, user, viewer]
'logs:filter'      -> [admin, user, viewer]
'logs:export'      -> [admin, user]

// Anomaly permissions
'anomalies:read'       -> [admin, user, viewer]
'anomalies:resolve'    -> [admin, user]
'anomalies:acknowledge'-> [admin, user, viewer]

// Alert permissions
'alerts:read'       -> [admin, user, viewer]
'alerts:acknowledge'-> [admin, user, viewer]
'alerts:resolve'    -> [admin, user]

// Settings permissions
'settings:read'     -> [admin, user, viewer]
'settings:write'    -> [admin]
'settings:backup'   -> [admin]
'settings:restore'  -> [admin]

// Configuration permissions
'config:alerts'       -> [admin]
'config:notifications'-> [admin]
'config:anomaly'      -> [admin]
'config:security'     -> [admin]

// User management permissions
'users:read'         -> [admin]
'users:create'       -> [admin]
'users:update'       -> [admin]
'users:delete'       -> [admin]
'users:manage-roles' -> [admin]

// System permissions
'system:health'      -> [admin, user, viewer]
'system:metrics'     -> [admin, user, viewer]
'system:admin-panel' -> [admin]

// Demo data permissions
'demo:generate' -> [admin]
'demo:clear'    -> [admin]

// Audit permissions
'audit:read'   -> [admin]
'audit:export' -> [admin]
```

### 2.2 Resource Permissions

Resources are protected at the route level with HTTP method-based permissions:

```javascript
// Example: Settings backup
'/api/settings/backup': {
  GET: [admin]
}

// Example: Logs
'/api/logs': {
  GET:    [admin, user, viewer],
  POST:   [admin],
  PUT:    [admin],
  DELETE: [admin]
}

// Example: Anomalies
'/api/anomalies': {
  GET:    [admin, user, viewer],
  POST:   [admin, user],
  PUT:    [admin, user],
  DELETE: [admin]
}
```

---

## 3. Implementation Architecture

### 3.1 Authentication Flow

```
User Login
    ↓
Username/Password verified
    ↓
JWT Token Generated
    ↓
Token contains: userId, role, expiresIn
    ↓
User sends token in Authorization header
    ↓
Middleware verifies token
    ↓
User object attached to request (req.user)
    ↓
Route handler checks authorization
    ↓
Request processed or rejected based on role
```

### 3.2 Authorization Components

#### Middleware: `auth.js`
```javascript
// Protect middleware - verifies JWT token
protect(req, res, next)

// Authorize middleware - checks user role
authorize(...roles)(req, res, next)

// Token generation
generateToken(userId)
```

#### Service: `rbacService.js`
```javascript
// Check permission
hasPermission(role, permission)

// Check resource access
canAccessResource(role, resource, method)

// Get role capabilities
getRoleCapabilities(role)

// Validate access
validateAccess(user, resourcePath, method)

// Filter data by role
filterByRole(user, data, roleField)
```

### 3.3 Protection Example

```javascript
// Route requires authentication
router.get('/api/logs', protect, (req, res) => {
  // req.user is available
  // User is authenticated
});

// Route requires authentication AND specific role
router.post('/api/settings', protect, authorize('admin'), (req, res) => {
  // Only admin users can access
});

// Using RBAC service for detailed checks
router.post('/api/settings/demo', protect, authorize('admin'), (req, res) => {
  if (!rbacService.isActionAllowed(req.user, 'demo:generate')) {
    return res.status(403).json({
      success: false,
      message: rbacService.getUnauthorizedMessage('demo:generate', req.user.role)
    });
  }
  // Process request
});
```

---

## 4. API Endpoints & RBAC

### 4.1 Settings Endpoints

| Method | Endpoint | Auth | Permissions | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/settings` | Required | admin (all), user (public), viewer (public) | Get all settings |
| POST | `/api/settings` | Admin | admin | Create new setting |
| DELETE | `/api/settings/:key` | Admin | admin | Delete setting |
| GET | `/api/settings/backup` | Admin | admin | Export settings backup |
| POST | `/api/settings/restore` | Admin | admin | Restore from backup |
| POST | `/api/settings/demo` | Admin | admin | Generate demo data |
| POST | `/api/settings/clear-demo` | Admin | admin | Clear demo data |

### 4.2 Logs Endpoints

| Method | Endpoint | Auth | Permissions | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/logs` | Required | admin, user, viewer | Get all logs |
| POST | `/api/logs` | Admin | admin | Create log |
| GET | `/api/logs/:id` | Required | admin, user, viewer | Get specific log |
| PUT | `/api/logs/:id` | Admin | admin | Update log |
| DELETE | `/api/logs/:id` | Admin | admin | Delete log |

### 4.3 Anomalies Endpoints

| Method | Endpoint | Auth | Permissions | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/anomalies` | Required | admin, user, viewer | Get all anomalies |
| POST | `/api/anomalies` | Required | admin, user | Create anomaly |
| GET | `/api/anomalies/:id` | Required | admin, user, viewer | Get specific anomaly |
| PUT | `/api/anomalies/:id` | Required | admin, user | Update anomaly (resolve) |
| DELETE | `/api/anomalies/:id` | Admin | admin | Delete anomaly |

### 4.4 Alerts Endpoints

| Method | Endpoint | Auth | Permissions | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/alerts` | Required | admin, user, viewer | Get all alerts |
| POST | `/api/alerts` | Admin | admin | Create alert |
| GET | `/api/alerts/:id` | Required | admin, user, viewer | Get specific alert |
| PUT | `/api/alerts/:id` | Required | admin, user | Update alert (acknowledge/resolve) |
| DELETE | `/api/alerts/:id` | Admin | admin | Delete alert |

### 4.5 Users Endpoints

| Method | Endpoint | Auth | Permissions | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/users` | Admin | admin | Get all users |
| POST | `/api/users` | Admin | admin | Create user |
| GET | `/api/users/:id` | Admin | admin | Get user details |
| PUT | `/api/users/:id` | Admin | admin | Update user |
| DELETE | `/api/users/:id` | Admin | admin | Delete user |

### 4.6 System Endpoints

| Method | Endpoint | Auth | Permissions | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/system/health` | Required | admin, user, viewer | Get health status |
| GET | `/api/system/metrics` | Required | admin, user, viewer | Get system metrics |
| GET | `/api/system/info` | Required | admin, user, viewer | Get system info |

### 4.7 Settings Management Endpoints

| Method | Endpoint | Auth | Permissions | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/settings-management/categories/alert-thresholds` | Required | all | Get alert thresholds |
| PUT | `/api/settings-management/categories/alert-thresholds` | Admin | admin | Update thresholds |
| GET | `/api/settings-management/categories/notifications` | Required | admin, user | Get notification settings |
| PUT | `/api/settings-management/categories/notifications` | Admin | admin | Update notifications |
| POST | `/api/settings-management/categories/notifications/test` | Admin | admin | Test notifications |
| GET | `/api/settings-management/categories/anomaly-detection` | Required | all | Get anomaly settings |
| PUT | `/api/settings-management/categories/anomaly-detection` | Admin | admin | Update anomaly detection |
| POST | `/api/settings-management/categories/anomaly-detection/run` | Admin | admin | Run detection |
| GET | `/api/settings-management/categories/security` | Admin | admin | Get security settings |
| PUT | `/api/settings-management/categories/security` | Admin | admin | Update security |
| POST | `/api/settings-management/categories/security/audit-log` | Admin | admin | View audit logs |
| POST | `/api/settings-management/categories/security/password-validation` | Required | all | Validate password |

---

## 5. Error Handling & Responses

### 5.1 Unauthorized (401) Response

When user is not authenticated:

```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 5.2 Forbidden (403) Response

When user lacks required permissions:

```json
{
  "success": false,
  "message": "Role 'user' is not authorized to perform action 'settings:backup'. Required roles: admin"
}
```

### 5.3 Invalid Input (400) Response

When request validation fails:

```json
{
  "success": false,
  "message": "Invalid backup file format",
  "details": "Backup must contain a settings object with key-value pairs",
  "providedFields": ["version", "timestamp", "data"]
}
```

### 5.4 Server Error (500) Response

When server processing fails:

```json
{
  "success": false,
  "message": "Failed to generate demo data",
  "details": "Insert operation failed: duplicate key error",
  "error": "..."  // Only in development mode
}
```

---

## 6. Audit Logging

All sensitive operations are logged with:
- **User**: who performed the action
- **Action**: what was done (backup, restore, generate_demo, clear_demo)
- **Resource**: what was affected (settings, demo_data, etc.)
- **Timestamp**: when it occurred
- **Status**: success or failure
- **Details**: relevant metadata

### Example Audit Log Entry

```javascript
{
  userId: ObjectId("..."),
  username: "admin",
  action: "backup",
  resource: "settings",
  timestamp: ISODate("2024-03-08T10:30:00Z"),
  status: "success",
  details: {
    count: 42,
    settingsExported: ["alerts", "notifications", "security"]
  }
}
```

---

## 7. Demo User Credentials

For testing purposes, the following demo users are created during seeding:

| Role | Username | Email | Password | Permissions |
|------|----------|-------|----------|-------------|
| Admin | admin | admin@example.com | admin123 | Full access |
| User | user | user@example.com | admin123 | Limited access |
| Viewer | viewer | viewer@example.com | admin123 | Read-only |

---

## 8. Security Best Practices

### 8.1 Token Management
- ✅ Tokens expire after 7 days (configurable via JWT_EXPIRE)
- ✅ Tokens stored securely in Authorization header
- ✅ Each request validates token signature and expiration
- ✅ User status (isActive) checked on every request

### 8.2 Password Security
- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ Password strength validation enforced
- ✅ Passwords never returned in API responses (select: false)
- ✅ MFA support available (mfaEnabled, mfaSecret fields)

### 8.3 Account Security
- ✅ Brute force detection (loginAttempts tracking)
- ✅ Automatic account lock after N failed attempts
- ✅ Session timeout enforcement
- ✅ Login attempt history maintained

### 8.4 Data Protection
- ✅ RBAC filtering prevents unauthorized data exposure
- ✅ Audit logging tracks all sensitive operations
- ✅ Sensitive fields marked with select: false in models
- ✅ Admin-only data separated from public data

---

## 9. Configuration & Customization

### 9.1 JWT Configuration

```bash
# .env file
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### 9.2 RBAC Customization

To add new roles or permissions, edit `rbacService.js`:

```javascript
// Add new role
ROLES.POWERUSER = 'poweruser';

// Add new permission
PERMISSIONS['custom:action'] = ['admin', 'poweruser'];

// Add to capability list
ROLE_CAPABILITIES.poweruser = {
  description: 'Power User',
  capabilities: [...]
};
```

### 9.3 Role-Specific Endpoints

To protect an endpoint with a specific role:

```javascript
// Require specific role
router.post('/api/admin-panel', protect, authorize('admin'), handler);

// Require multiple roles
router.get('/api/report', protect, authorize('admin', 'user'), handler);

// Custom permission check
router.delete('/api/users/:id', protect, (req, res) => {
  if (!rbacService.isActionAllowed(req.user, 'users:delete')) {
    return res.status(403).json({...});
  }
  // Process deletion
});
```

---

## 10. Testing RBAC

### 10.1 Login and Get Token

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Response includes token
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### 10.2 Use Token in Requests

```bash
# Authorized request (admin can access)
curl -X GET http://localhost:5000/api/settings/backup \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response: 200 OK with backup data
{
  "success": true,
  "message": "Settings backup created with 42 items",
  "data": {...}
}
```

### 10.3 Test Unauthorized Access

```bash
# Unauthorized request (viewer cannot access admin endpoint)
curl -X POST http://localhost:5000/api/settings/demo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response: 403 Forbidden
{
  "success": false,
  "message": "Role 'viewer' is not authorized to perform action 'demo:generate'. Required roles: admin"
}
```

---

## 11. Troubleshooting

### Issue: "Not authorized to access this route"
**Cause**: Missing or invalid JWT token
**Solution**: 
1. Login again to get new token
2. Include token in Authorization header: `Bearer <token>`
3. Check token expiration

### Issue: "Role 'user' is not authorized..."
**Cause**: User trying to access admin-only resource
**Solution**:
1. Verify user has correct role
2. Request admin to perform action
3. Check API endpoint RBAC requirements

### Issue: "Invalid backup file format"
**Cause**: Backup JSON structure doesn't match expected format
**Solution**:
1. Verify backup contains `settings` object
2. Check backup version compatibility (v1.x)
3. Use file created by `/api/settings/backup` endpoint

---

## 12. Summary

The RBAC system provides:
- ✅ **Role-Based Control**: 3 predefined roles with clear permissions
- ✅ **Fine-Grained Permissions**: 30+ permissions across all resources
- ✅ **Audit Logging**: Track all sensitive operations
- ✅ **Error Handling**: Descriptive messages for security failures
- ✅ **Easy Integration**: Simple middleware and service functions
- ✅ **Customizable**: Easy to add new roles and permissions
- ✅ **Secure**: Best practices for password, token, and data protection

---

## 13. Related Files

- **Authentication**: `src/middleware/auth.js`
- **RBAC Service**: `src/services/rbacService.js`
- **User Model**: `src/models/User.js`
- **Settings Routes**: `src/routes/settings.js`
- **Settings Management**: `src/routes/settingsManagement.js`
- **Security Service**: `src/services/securityService.js`

---

*Last Updated: March 8, 2026*
*Version: 1.0.0*
