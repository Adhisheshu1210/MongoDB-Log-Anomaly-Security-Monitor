# MongoDB Log Anomaly & Security Monitor - Frontend Architecture Implementation Guide

## Project Overview

This is a production-grade SIEM (Security Information and Event Management) style monitoring platform built with React 18, Vite, and Tailwind CSS. The application provides real-time log monitoring, anomaly detection, and security incident management with complete role-based access control.

## Architecture Summary

### Directory Structure

```
frontend/
├── src/
│   ├── app/                 # Application setup
│   │   ├── router.jsx       # Route definitions
│   │   ├── ProtectedRoute.jsx # RBAC protection
│   │   └── AppProviders.jsx # Provider setup
│   ├── assets/              # Static assets
│   ├── components/          # Reusable components
│   │   ├── common/          # Common UI components
│   │   ├── charts/          # Recharts components
│   │   ├── cards/           # Dashboard cards
│   │   ├── forms/           # Form components
│   │   ├── layout/          # Layout components
│   │   ├── notifications/   # Toast & alerts
│   │   ├── realtime/        # Real-time components
│   │   ├── tables/          # Data tables
│   │   └── modals/          # Modal dialogs
│   ├── context/             # React contexts
│   │   ├── AuthContext.jsx
│   │   ├── SocketContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Page layouts
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── styles/              # Global styles
│   ├── utils/               # Utility functions
│   ├── main.jsx             # Entry point
│   └── App.jsx              # Root component
```

## Implemented Components

### ✅ Core Infrastructure
- **Authentication System**: JWT-based auth with token refresh
- **Context Providers**: Auth, Socket, Theme, Notification
- **Router**: Role-based routing with protected routes
- **API Layer**: Axios with interceptors
- **Real-time Updates**: Socket.IO integration
- **Styling**: Tailwind CSS dark theme

### ✅ Layout Components
- **MainLayout**: Base wrapper for authenticated pages
- **AdminLayout**: Admin-specific layout
- **UserLayout**: Analyst/User layout
- **ViewerLayout**: Read-only viewer layout
- **Sidebar**: Navigation with role-specific items
- **Header**: User menu and system status
- **Toast Notifications**: Error/success alerts
- **Notification Panel**: Real-time event feed

### ✅ Custom Hooks
- `useAuth()`: Authentication context
- `useSocket()`: WebSocket context
- `useTheme()`: Theme management
- `useNotification()`: Toast notifications
- `useRealtimeLogs()`: Real-time log updates
- `useAlerts()`: Alert management
- `useAnomalies()`: Anomaly detection

## Component Implementation Guide

### 1. Common Components

Create reusable UI components in `src/components/common/`:

```javascript
// Button.jsx
export default function Button({ variant = 'primary', ...props }) {
  const baseClasses = 'px-4 py-2 rounded font-semibold transition';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'border border-slate-600 hover:bg-slate-700',
  };
  return <button className={`${baseClasses} ${variants[variant]}`} {...props} />;
}
```

### 2. Card Components

Create dashboard cards in `src/components/cards/`:

```javascript
// StatCard.jsx
export default function StatCard({ title, value, trend, icon: Icon }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
        </div>
        <Icon className="text-blue-400" />
      </div>
      {trend && <p className="text-green-400 text-xs mt-2">{trend}</p>}
    </div>
  );
}
```

### 3. Chart Components

Create charts in `src/components/charts/`:

```javascript
// SeverityChart.jsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../../utils/constants';

export default function SeverityChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### 4. Table Components

Create data tables in `src/components/tables/`:

```javascript
// LogsTable.jsx
export default function LogsTable({ logs, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className="px-4 py-2 text-left">Timestamp</th>
            <th className="px-4 py-2 text-left">Component</th>
            <th className="px-4 py-2 text-left">Message</th>
            <th className="px-4 py-2 text-left">Severity</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id} onClick={() => onRowClick(log)} className="hover:bg-slate-700 cursor-pointer">
              <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="px-4 py-2">{log.component}</td>
              <td className="px-4 py-2 truncate">{log.message}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 rounded text-xs ${getBadgeClass(log.severity)}`}>
                  {log.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Page Implementation Examples

### Admin Dashboard Page

```javascript
// pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import * as statsService from '../../services/stats.service';
import StatCard from '../../components/cards/StatCard';
import SeverityChart from '../../components/charts/SeverityChart';

export default function AdminDashboard() {
  const { showLoading, showError } = useNotification();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsService.getSummary();
        setStats(response.data);
      } catch (error) {
        showError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSkelet />;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Logs" value={stats?.totalLogs} />
        <StatCard title="Active Alerts" value={stats?.activeAlerts} />
        <StatCard title="Anomalies" value={stats?.anomalies} />
        <StatCard title="System Health" value={stats?.health} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Severity Distribution</h3>
          <SeverityChart data={stats?.severityData} />
        </div>
      </div>
    </div>
  );
}
```

### User Logs Page

```javascript
// pages/user/Logs.jsx
import React, { useState, useEffect } from 'react';
import { useRealtimeLogs } from '../../hooks/useRealtimeLogs';
import * as logsService from '../../services/logs.service';
import LogsTable from '../../components/tables/LogsTable';

export default function UserLogs() {
  const { logs, newLogsCount, clearNewLogs } = useRealtimeLogs();
  const [filter, setFilter] = useState({});

  const handleSearch = (query) => {
    setFilter({ ...filter, search: query });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Logs</h1>
        {newLogsCount > 0 && (
          <button onClick={clearNewLogs} className="px-4 py-2 bg-blue-600 rounded">
            {newLogsCount} new logs
          </button>
        )}
      </div>

      <LogsTable logs={logs} />
    </div>
  );
}
```

## Real-Time Features

### Socket.IO Integration

The Socket.IO integration handles real-time events:

```javascript
// Listen for new logs
const { on } = useSocket();

useEffect(() => {
  const unsubscribe = on('log:new', (log) => {
    setLogs(prev => [log, ...prev]);
  });
  return unsubscribe;
}, [on]);
```

### WebSocket Events Supported

- `log:new` - New log entry received
- `anomaly:detected` - New anomaly detected
- `alert:new` - New alert triggered
- `alert:resolved` - Alert resolved
- `system:update` - System status updated
- `health:update` - Health metrics updated

## RBAC Implementation

### Permission Checks

```javascript
import { hasPermission, canAccessPage } from './utils/permissions';

// Check single permission
if (hasPermission(user.role, 'manage_users')) {
  // Show user management UI
}

// Check if user can access page
if (canAccessPage(user.role, '/admin/users')) {
  // Navigate to page
}
```

### Role-Based Routes

Routes are automatically protected by role:
- **Admin**: `/admin/*`
- **User**: `/user/*`
- **Viewer**: `/viewer/*` (read-only)

## State Management

### Auth Context

```javascript
const { user, isAuthenticated, login, logout } = useAuth();
```

### Notification System

```javascript
const { showSuccess, showError, showWarning } = useNotification();

showSuccess('Operation completed');
showError('An error occurred');
```

### Real-Time Updates

```javascript
const { on, emit, isConnected } = useSocket();

on('alert:new', (alert) => {
  // Handle new alert
});
```

## Styling Approach

### Tailwind CSS + Dark Theme

- Base color: `slate-900` (very dark)
- Cards: `slate-800` with `slate-700` borders
- Accents: `blue-600` primary, `red-600` danger
- Text: `slate-300` normal, `white` emphasis

### Responsive Design

```javascript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive cards */}
</div>
```

## API Integration Patterns

### Fetch Data with Error Handling

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (err) {
      setError(err.message);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Mutation Patterns

```javascript
const handleSubmit = async (formData) => {
  try {
    const response = await api.post('/resource', formData);
    showSuccess('Created successfully');
    setData(prev => [...prev, response.data]);
  } catch (error) {
    showError(error.response?.data?.message || 'Failed to create');
  }
};
```

## Performance Optimization

### Code Splitting

Pages are automatically code-split via React Router:
```javascript
<Route path="/page" element={<lazy lazy-loaded component />} />
```

### Memoization

```javascript
const Component = React.memo(({ props }) => {
  return <div>{props.value}</div>;
}, (prev, next) => prev.value === next.value);
```

### Debounced Search

```javascript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const handleSearch = useMemo(
  () => debounce((query) => {
    // Perform search
  }, 300),
  []
);
```

## Security Best Practices

1. **JWT Token Storage**: Tokens stored in localStorage with refresh mechanism
2. **Route Protection**: All routes protected by role-based guards
3. **API Interceptors**: Automatic token attachment and 401 handling
4. **XSS Prevention**: React's built-in escaping + sanitized user input
5. **CORS**: Configured on backend

## Testing Strategy

### Component Testing

```javascript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Hook Testing

```javascript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './hooks/useAuth';

test('login updates user', async () => {
  const { result } = renderHook(() => useAuth());
  
  act(() => {
    result.current.login('test@test.com', 'password');
  });
  
  expect(result.current.user).toBeDefined();
});
```

## Deployment Checklist

- [ ] Environment variables configured (`.env.production`)
- [ ] Build optimization applied (`vite build`)
- [ ] API endpoints verified
- [ ] WebSocket connection tested
- [ ] RBAC permissions tested
- [ ] Error pages configured
- [ ] Authentication flow tested
- [ ] Real-time features tested
- [ ] Mobile responsiveness verified
- [ ] Performance metrics checked

## Useful Commands

```bash
# Development
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Type checking (if using TypeScript)
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Next Steps for Development

1. **Implement detailed page components** for all dashboard pages
2. **Create form components** for user management and settings
3. **Add data visualization** with advanced Recharts features
4. **Implement search and filtering** with debouncing
5. **Add modal dialogs** for confirmations and data entry
6. **Create advanced tables** with sorting and pagination
7. **Implement theme switcher** (dark/light mode toggle)
8. **Add loading skeletons** for better UX
9. **Create error boundaries** for error handling
10. **Add analytics tracking**

## Troubleshooting

### Socket.IO Connection Issues

Ensure backend is running on correct port and CORS is configured properly.

### API Calls Failing

Check that `VITE_API_URL` environment variable is set correctly.

### Styles Not Applied

Ensure Tailwind CSS is compiled properly. Check `tailwind.config.js`.

### Authentication Loop

Verify token refresh endpoint is working and refresh token is valid.

---

**Project Status**: ✅ Architecture Complete - Ready for Feature Implementation

**Created**: May 2026
**Framework**: React 18 + Vite + Tailwind CSS
**License**: Proprietary
