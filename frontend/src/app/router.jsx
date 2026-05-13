/**
 * Application Router Configuration
 * Defines all routes and role-based navigation
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import UserLayout from '../layouts/UserLayout';
import ViewerLayout from '../layouts/ViewerLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import VerifyOtp from '../pages/auth/VerifyOtp';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminSettings from '../pages/admin/Settings';
import AdminReports from '../pages/admin/Reports';
import AdminSecurityCenter from '../pages/admin/SecurityCenter';
import AdminInfrastructure from '../pages/admin/Infrastructure';
import AdminAuditLogs from '../pages/admin/AuditLogs';
import AdminAIControls from '../pages/admin/AIControls';
import AdminProfile from '../pages/admin/Profile';
import AdminDatasets from '../pages/admin/Datasets';

// User Pages
import UserDashboard from '../pages/user/Dashboard';
import UserLogs from '../pages/user/Logs';
import UserAlerts from '../pages/user/Alerts';
import UserAnomalies from '../pages/user/Anomalies';
import UserInvestigations from '../pages/user/Investigations';
import UserAIInsights from '../pages/user/AIInsights';
import UserLiveMonitoring from '../pages/user/LiveMonitoring';
import UserProfile from '../pages/user/Profile';
import UserDatasets from '../pages/user/Datasets';


// Viewer Pages
import ViewerDashboard from '../pages/viewer/Dashboard';
import ViewerLiveMonitoring from '../pages/viewer/LiveMonitoring';
import ViewerLogsView from '../pages/viewer/LogsView';
import ViewerAlertsView from '../pages/viewer/AlertsView';
import ViewerProfile from '../pages/viewer/Profile';
import ViewerDatasets from '../pages/viewer/Datasets';

// Public landing
import LandingRouteWrapper from '../pages/landing/landingRouteWrapper';

// Error Pages
import NotFound from '../pages/errors/NotFound';
import Unauthorized from '../pages/errors/Unauthorized';
import ServerError from '../pages/errors/ServerError';

// Protected Routes
import ProtectedRoute from './ProtectedRoute';
import { getRoleHomePage, normalizeRole } from '../utils/permissions';

const AppRouter = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const defaultRoute = getRoleHomePage(normalizeRole(user?.role));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        {/* Primary auth routes */}
        <Route path="/auth/login" element={<Navigate to="/login" replace />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/verify-otp" element={<VerifyOtp />} />

        {/* Legacy / convenience aliases used by current UI */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset" element={<VerifyOtp />} />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/error" element={<ServerError />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin" layout={AdminLayout}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="datasets" element={<AdminDatasets />} />
                <Route path="security-center" element={<AdminSecurityCenter />} />
                <Route path="infrastructure" element={<AdminInfrastructure />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="ai-controls" element={<AdminAIControls />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* User Routes */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute requiredRole="user" layout={UserLayout}>
              <Routes>
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="logs" element={<UserLogs />} />
                <Route path="live-monitoring" element={<UserLiveMonitoring />} />
                <Route path="datasets" element={<UserDatasets />} />
                <Route path="alerts" element={<UserAlerts />} />
                <Route path="anomalies" element={<UserAnomalies />} />
                <Route path="investigations" element={<UserInvestigations />} />
                <Route path="ai-insights" element={<UserAIInsights />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/user/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Viewer Routes */}
        <Route
          path="/viewer/*"
          element={
            <ProtectedRoute requiredRole="viewer" layout={ViewerLayout}>
              <Routes>
                <Route path="dashboard" element={<ViewerDashboard />} />
                <Route path="live-monitoring" element={<ViewerLiveMonitoring />} />
                <Route path="logs" element={<ViewerLogsView />} />
                <Route path="datasets" element={<ViewerDatasets />} />
                <Route path="alerts" element={<ViewerAlertsView />} />
                <Route path="profile" element={<ViewerProfile />} />
                <Route path="*" element={<Navigate to="/viewer/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Landing/Home Route (public) */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={defaultRoute} replace />
            ) : (
              <Navigate to="/landing" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <Navigate to="/login" replace />}
        />

        <Route path="/landing" element={<LandingRouteWrapper />} />

        {/* Catch all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
