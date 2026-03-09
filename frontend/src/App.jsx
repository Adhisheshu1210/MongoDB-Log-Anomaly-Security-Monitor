import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Anomalies from './pages/Anomalies';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ViewerDashboard from './pages/ViewerDashboard';
import LoadingScreen from './components/LoadingScreen';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return user ? children : <Navigate to="/login" />;
}

// Role-based redirect component
function RoleBasedRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'user':
          navigate('/user', { replace: true });
          break;
        case 'viewer':
          navigate('/viewer', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  return null;
}

// Admin route guard
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

// User/DevOps route guard
function UserRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Allow admin and user roles
  if (user.role !== 'admin' && user.role !== 'user') {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

// Viewer route guard
function ViewerRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Default dashboard - redirects based on role */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <RoleBasedRedirect />
          </PrivateRoute>
        }
      />
      
      {/* Admin Dashboard Routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <Layout>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* User/Developer Dashboard Routes */}
      <Route
        path="/user"
        element={
          <PrivateRoute>
            <Layout>
              <UserRoute>
                <UserDashboard />
              </UserRoute>
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Viewer Dashboard Routes */}
      <Route
        path="/viewer"
        element={
          <PrivateRoute>
            <Layout>
              <ViewerRoute>
                <ViewerDashboard />
              </ViewerRoute>
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Shared routes - accessible by all authenticated users */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/anomalies" element={<Anomalies />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;

