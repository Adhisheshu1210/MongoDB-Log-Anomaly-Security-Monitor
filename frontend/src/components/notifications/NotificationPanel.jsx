/**
 * Notification Panel Component
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { notificationsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { lastEvent } = useSocket();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.list({ limit: 5 });
      const payload = response.data?.data || response.data || {};
      setNotifications(Array.isArray(payload) ? payload : payload.data || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const visibleNotifications = useMemo(() => {
    if (notifications.length > 0) return notifications;
    if (lastEvent) {
      return [{
        _id: 'socket-last-event',
        type: 'system',
        title: lastEvent.event || 'Live Event',
        message: JSON.stringify(lastEvent.data || {}).substring(0, 120),
        severity: 'info',
        createdAt: new Date().toISOString(),
        actionUrl: ''
      }];
    }
    return [];
  }, [notifications, lastEvent]);

  const markRead = async (notificationId) => {
    try {
      await notificationsAPI.markRead(notificationId);
      setNotifications((current) => current.map((item) => item._id === notificationId ? { ...item, status: 'read' } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      toast.error('Failed to mark notification read');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, status: 'read' })));
      setUnreadCount(0);
    } catch (error) {
      toast.error('Failed to mark all read');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {isOpen && (
        <div className="w-96 max-w-[90vw] bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Notifications</h3>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={markAllRead} className="p-1 hover:bg-slate-700 rounded text-slate-300" title="Mark all read">
                <CheckCheck size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-700 rounded text-slate-300">
              <X size={16} />
            </button>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading notifications...</p>
          ) : visibleNotifications.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {visibleNotifications.map((item) => (
                <div key={item._id} className={`p-3 rounded text-sm border ${item.status === 'new' ? 'bg-slate-700 border-indigo-500/30' : 'bg-slate-700/60 border-slate-600'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">{item.type || 'system'}</p>
                      <p className="text-white font-semibold mt-1">{item.title}</p>
                      <p className="text-slate-300 mt-1 text-xs leading-relaxed">{item.message}</p>
                      <p className="text-slate-500 mt-2 text-[10px] uppercase tracking-widest">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</p>
                    </div>
                    {item.actionUrl ? (
                      <a href={item.actionUrl} className="text-slate-300 hover:text-white" title="Open">
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </div>
                  {item.status === 'new' ? (
                    <button
                      type="button"
                      onClick={() => markRead(item._id)}
                      className="mt-2 text-[10px] uppercase tracking-widest text-indigo-300 hover:text-white"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No notifications yet</p>
          )}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition"
      >
        <Bell size={20} />
      </button>
    </div>
  );
};

export default NotificationPanel;
