/**
 * useAnomalies - Hook for managing anomalies
 */

import { useState, useEffect } from 'react';
import { useSocket } from './useContexts';
import { SOCKET_EVENTS } from '../utils/constants';
import * as anomalyService from '../services/anomalies.service';

export const useAnomalies = () => {
  const { on, off } = useSocket();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newAnomaliesCount, setNewAnomaliesCount] = useState(0);

  // Fetch initial anomalies
  useEffect(() => {
    const fetchAnomalies = async () => {
      setLoading(true);
      try {
        const response = await anomalyService.getAnomalies();
        setAnomalies(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  // Listen for new anomalies
  useEffect(() => {
    const handleAnomalyDetected = (anomaly) => {
      setAnomalies((prev) => [anomaly, ...prev]);
      setNewAnomaliesCount((prev) => prev + 1);
    };

    const unsubscribe = on(SOCKET_EVENTS.ANOMALY_DETECTED, handleAnomalyDetected);

    return () => {
      off(SOCKET_EVENTS.ANOMALY_DETECTED, handleAnomalyDetected);
      unsubscribe?.();
    };
  }, [on, off]);

  const clearNewAnomalies = () => {
    setNewAnomaliesCount(0);
  };

  return {
    anomalies,
    setAnomalies,
    loading,
    error,
    newAnomaliesCount,
    clearNewAnomalies,
  };
};

export default useAnomalies;
