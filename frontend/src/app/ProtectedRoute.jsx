/**
 * ProtectedRoute Component
 * Handles role-based access control and route protection
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { canAccessPage, getRoleHomePage, normalizeRole } from '../utils/permissions';

const ProtectedRoute = ({ children, requiredRole, allowedRoles, layout: Layout }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const userRole = normalizeRole(user?.role);
  const roleHome = getRoleHomePage(userRole);
  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map((role) => normalizeRole(role))
    : null;

  if (requiredRole && userRole !== normalizeRole(requiredRole)) {
    return <Navigate to={roleHome} replace />;
  }

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to={roleHome} replace />;
  }

  if (!canAccessPage(userRole, location.pathname)) {
    return <Navigate to={roleHome} replace />;
  }

  // Wrap with layout if provided
  if (Layout) {
    return (
      <SocketProvider>
        <Layout>{children}</Layout>
      </SocketProvider>
    );
  }

  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
};

export default ProtectedRoute;
