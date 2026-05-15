/**
 * Header Component
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, User, Settings, Users, AlertCircle, CheckCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { notificationsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatUserName } from '../../utils/formatters';
import { normalizeRole } from '../../utils/permissions';

const Header = ({ user, onSidebarToggle }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isConnected, on } = useSocket();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const currentRole = normalizeRole(user?.role);

  const getRoleLabel = () => {
    const roleLabels = {
      admin: 'Administrator',
      user: 'Analyst',
      viewer: 'Viewer'
    };
    return roleLabels[currentRole] || currentRole;
  };

  const getRoleDescription = () => {
    const descriptions = {
      admin: 'Full system access and management',
      user: 'Can view, acknowledge, and resolve alerts',
      viewer: 'Read-only access to logs and alerts'
    };
    return descriptions[currentRole] || 'User';
  };

  const getConnectedRoles = () => {
    const allRoles = {
      admin: ['Analytics', 'Security', 'Operations', 'Management'],
      user: ['Security Team', 'Analytics'],
      viewer: ['Observer', 'Stakeholder']
    };
    return allRoles[currentRole] || [];
  };

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationsAPI.list({ limit: 5 });
      const items = response.data?.data || [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = on('notification:new', (notification) => {
      setNotifications((current) => {
        const exists = current.some((item) => item._id === notification._id);
        if (exists) return current;
        return [notification, ...current].slice(0, 5);
      });
    });

    return unsubscribe;
  }, [on]);

  useEffect(() => {
    const unsubscribeAlert = on('alert:new', (alert) => {
      setNotifications((current) => [{
        _id: `alert-${alert._id}`,
        type: 'alert',
        title: 'New Alert',
        message: alert.title || 'New alert received',
        severity: alert.severity || 'info',
        status: 'new',
        createdAt: alert.createdAt || new Date().toISOString(),
        actionUrl: '/admin/alerts'
      }, ...current].slice(0, 5));
    });

    return unsubscribeAlert;
  }, [on]);

  const unreadCount = useMemo(() => notifications.filter((n) => n.status !== 'read').length, [notifications]);

  const handleNotificationClick = async (notification) => {
    try {
      if (notification._id && !String(notification._id).startsWith('alert-')) {
        await notificationsAPI.markRead(notification._id);
      }
    } catch (error) {
      // keep navigation responsive even if mark-read fails
    }

    setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, status: 'read' } : item));

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setShowNotifications(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, status: 'read' })));
    } catch (error) {
      toast.error('Failed to mark notifications read');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onSidebarToggle}
          className="p-2 hover:bg-slate-700 rounded transition"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />

        {/* Connections Display */}
        <div className="relative">
          <button
            onClick={() => setShowConnections(!showConnections)}
            className="p-2 hover:bg-slate-700 rounded transition flex items-center gap-1"
            title={getRoleDescription()}
          >
            <Users size={20} />
            <span className="text-xs hidden sm:inline">{getRoleLabel()}</span>
          </button>

          {showConnections && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-50">
              <div className="p-4 border-b border-slate-600">
                <p className="font-semibold text-sm">Role & Connections</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Current Role</p>
                  <p className="text-sm font-medium">{getRoleLabel()}</p>
                  <p className="text-xs text-slate-400 mt-1">{getRoleDescription()}</p>
                </div>
                <div className="border-t border-slate-600 pt-4">
                  <p className="text-xs text-slate-400 mb-2">Connected Departments</p>
                  <div className="flex flex-wrap gap-2">
                    {getConnectedRoles().map((role, idx) => (
                      <span key={idx} className="text-xs bg-slate-600 text-slate-200 px-2 py-1 rounded">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-700 rounded relative transition"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-slate-600 sticky top-0 bg-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">Notifications</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">{unreadCount} unread</p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="p-1 rounded hover:bg-slate-600 text-slate-300"
                    title="Mark all read"
                  >
                    <CheckCheck size={16} />
                  </button>
                </div>
              </div>
              {loadingNotifications ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                  Loading notifications...
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-slate-600">
                  {notifications.map((notification) => (
                    <button
                      key={notification._id}
                      onClick={() => {
                        handleNotificationClick(notification);
                        if (!notification.actionUrl) {
                          navigate(currentRole === 'admin' ? '/admin/audit-logs' : currentRole === 'viewer' ? '/viewer/alerts' : '/user/alerts');
                        }
                        setShowNotifications(false);
                      }}
                      className={`w-full text-left p-4 hover:bg-slate-600 transition ${notification.status !== 'read' ? 'bg-slate-600/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${notification.status !== 'read' ? 'w-2 h-2 bg-red-500 rounded-full' : 'w-2 h-2 bg-transparent'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <p className="text-xs text-slate-500">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p>
                            {notification.actionUrl ? <ExternalLink size={12} className="text-slate-500" /> : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm">
                  No notifications
                </div>
              )}
              <div className="p-3 border-t border-slate-600 bg-slate-700 sticky bottom-0">
                <button
                  onClick={() => {
                    navigate(currentRole === 'admin' ? '/admin/audit-logs' : currentRole === 'viewer' ? '/viewer/alerts' : '/user/alerts');
                    setShowNotifications(false);
                  }}
                  className="w-full text-xs text-slate-300 hover:text-white transition"
                >
                  View All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}


        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded transition"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {formatUserName(user).charAt(0)}
            </div>
            <span className="text-sm">{formatUserName(user)}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-50">
              <div className="p-4 border-b border-slate-600">
                <p className="font-semibold">{formatUserName(user)}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (currentRole === 'admin') {
                      navigate('/admin/profile');
                    } else if (currentRole === 'viewer') {
                      navigate('/viewer/profile');
                    } else {
                      navigate('/user/profile');
                    }
                  }}

                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-600 rounded text-left"
                >
                  <User size={16} />
                  <span className="text-sm">Profile</span>
                </button>

                {currentRole === 'admin' ? (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/admin/settings');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-600 rounded text-left"
                  >
                    <Settings size={16} />
                    <span className="text-sm">Settings</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center gap-2 px-4 py-2 rounded text-left text-slate-400 bg-slate-700/40 cursor-not-allowed"
                    title="Settings are available for admin only"
                  >
                    <Settings size={16} />
                    <span className="text-sm">Settings</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-600 rounded text-left text-red-400"
                >
                  <LogOut size={16} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
