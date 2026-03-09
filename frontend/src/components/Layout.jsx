import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  User,
  ChevronDown,
  Shield,
  Users,
  Server
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // Get role-specific navigation items
  const getNavItems = () => {
    const role = user?.role;
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ];

    // Role-based dashboard redirects
    if (role === 'admin') {
      items.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
    } else if (role === 'user') {
      items.push({ path: '/user', label: 'DevOps Dashboard', icon: Server });
    } else if (role === 'viewer') {
      items.push({ path: '/viewer', label: 'Viewer Dashboard', icon: Activity });
    }

    // Common navigation items
    items.push(
      { path: '/logs', label: 'Logs', icon: FileText },
      { path: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
      { path: '/alerts', label: 'Alerts', icon: Bell }
    );

    // Settings - visible to all but with different access
    items.push({ path: '/settings', label: 'Settings', icon: Settings });

    return items;
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatRole = (role) => {
    const normalized = (role || 'user').toLowerCase();
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'viewer') return 'Viewer';
    return 'User';
  };

  const getRoleBadgeClass = (role) => {
    const normalized = (role || 'user').toLowerCase();
    if (normalized === 'admin') {
      return 'bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/40';
    }
    if (normalized === 'viewer') {
      return 'bg-cyber-info/20 text-cyber-info border border-cyber-info/40';
    }
    return 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40';
  };

  // Check if current path matches nav item
  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-cyber-dark flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-cyber-card border-r border-cyber-border transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-cyber-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-cyber-accent" />
            <span className="text-lg font-bold text-white">Log Monitor</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(user?.role)}`}>
              {formatRole(user?.role)}
            </span>
            <span className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'Full Access' : user?.role === 'viewer' ? 'Read-Only' : 'Standard Access'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30'
                    : 'text-gray-400 hover:bg-cyber-border hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin-only section */}
        {user?.role === 'admin' && (
          <div className="px-4 py-2 border-t border-cyber-border">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Admin</p>
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActivePath('/admin')
                  ? 'bg-cyber-danger/10 text-cyber-danger border border-cyber-danger/30'
                  : 'text-gray-400 hover:bg-cyber-border hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">User Management</span>
            </Link>
          </div>
        )}

        {/* Connection Status */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-cyber-success animate-pulse' : 'bg-cyber-danger'}`} />
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-cyber-card border-b border-cyber-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-white">
              {navItems.find((item) => isActivePath(item.path))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(user?.role)}`}
              title={`Current role: ${formatRole(user?.role)}`}
            >
              {formatRole(user?.role)}
            </span>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <div className="w-8 h-8 rounded-full bg-cyber-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-cyber-accent" />
                </div>
                <span className="hidden sm:inline">{user?.username || 'User'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-cyber-card border border-cyber-border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-cyber-border">
                    <p className="text-sm font-medium text-white">{user?.username}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getRoleBadgeClass(user?.role)}`}>
                      {formatRole(user?.role)}
                    </span>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-cyber-border rounded"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-cyber-danger hover:bg-cyber-border rounded"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

