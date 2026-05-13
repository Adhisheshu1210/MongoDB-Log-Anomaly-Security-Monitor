/**
 * useAlerts - Hook for managing alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useContexts';
import { SOCKET_EVENTS } from '../utils/constants';
import * as alertService from '../services/alerts.service';

export const useAlerts = () => {
  const { on, off } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const response = await alertService.getAlerts();
        setAlerts(response.data);
        const unread = response.data.filter((a) => a.status === 'open').length;
        setUnreadCount(unread);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  // Listen for new alerts
  useEffect(() => {
    const handleNewAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleAlertResolved = ({ alertId }) => {
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === alertId ? { ...a, status: 'resolved' } : a
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const unsubscribeNew = on(SOCKET_EVENTS.ALERT_NEW, handleNewAlert);
    const unsubscribeResolved = on(SOCKET_EVENTS.ALERT_RESOLVED, handleAlertResolved);

    return () => {
      off(SOCKET_EVENTS.ALERT_NEW, handleNewAlert);
      off(SOCKET_EVENTS.ALERT_RESOLVED, handleAlertResolved);
      unsubscribeNew?.();
      unsubscribeResolved?.();
    };
  }, [on, off]);

  const acknowledgeAlert = useCallback(async (alertId) => {
    try {
      await alertService.acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === alertId ? { ...a, status: 'acknowledged' } : a
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId) => {
    try {
      await alertService.resolveAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === alertId ? { ...a, status: 'resolved' } : a
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    alerts,
    loading,
    error,
    unreadCount,
    acknowledgeAlert,
    resolveAlert,
  };
};

export default useAlerts;
