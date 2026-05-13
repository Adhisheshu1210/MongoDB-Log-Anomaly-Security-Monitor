/**
 * Main Layout - Base wrapper for authenticated layouts
 */

import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/permissions';

const MainLayout = ({ children, sidebarItems }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const currentRole = normalizeRole(user?.role);

  const filteredSidebarItems = (sidebarItems || []).filter((item) => {
    if (!item.allowedRoles || !Array.isArray(item.allowedRoles)) {
      return true;
    }
    return item.allowedRoles.includes(currentRole);
  });

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <Sidebar
        items={filteredSidebarItems}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          user={user}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel />
    </div>
  );
};

export default MainLayout;
