/**
 * NotificationContext - Manages toast notifications
 * Centralized notification state management
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { NOTIFICATION_TYPES, TOAST_DURATION } from '../utils/constants';

export const NotificationContext = createContext();

let notificationId = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timeoutRefs = useRef({});

  const addNotification = useCallback(
    (message, type = NOTIFICATION_TYPES.INFO, duration = TOAST_DURATION.MEDIUM) => {
      const id = notificationId++;

      const notification = {
        id,
        message,
        type,
        timestamp: new Date(),
      };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        const timeout = setTimeout(() => {
          removeNotification(id);
        }, duration);

        timeoutRefs.current[id] = timeout;
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
  }, []);

  const showSuccess = useCallback(
    (message, duration = TOAST_DURATION.MEDIUM) => {
      return addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
    },
    [addNotification]
  );

  const showError = useCallback(
    (message, duration = TOAST_DURATION.LONG) => {
      return addNotification(message, NOTIFICATION_TYPES.ERROR, duration);
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (message, duration = TOAST_DURATION.MEDIUM) => {
      return addNotification(message, NOTIFICATION_TYPES.WARNING, duration);
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (message, duration = TOAST_DURATION.MEDIUM) => {
      return addNotification(message, NOTIFICATION_TYPES.INFO, duration);
    },
    [addNotification]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    Object.values(timeoutRefs.current).forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current = {};
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
