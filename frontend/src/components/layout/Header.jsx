/**
 * Header Component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatUserName } from '../../utils/formatters';
import { normalizeRole } from '../../utils/permissions';

const Header = ({ user, onSidebarToggle }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isConnected } = useSocket();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const currentRole = normalizeRole(user?.role);

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

        {/* Notifications */}
        <button className="p-2 hover:bg-slate-700 rounded relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

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
