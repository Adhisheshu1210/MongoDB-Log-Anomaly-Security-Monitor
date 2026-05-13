/**
 * Toast Notification Component
 */

import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { NOTIFICATION_TYPES } from '../../utils/constants';

const Toast = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="text-green-400" />;
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className="text-red-400" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="text-yellow-400" />;
      case NOTIFICATION_TYPES.INFO:
      default:
        return <Info className="text-blue-400" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-green-900 border-green-700';
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-900 border-red-700';
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-yellow-900 border-yellow-700';
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'bg-blue-900 border-blue-700';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center gap-3 p-4 rounded-lg border ${getBgColor(
            notification.type
          )} text-white animate-slide-in`}
        >
          <div className="flex-shrink-0">{getIcon(notification.type)}</div>
          <div className="flex-1">
            <p className="text-sm">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
