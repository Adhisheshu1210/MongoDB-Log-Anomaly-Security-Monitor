/**
 * useRealtimeLogs - Hook for real-time log updates
 */

import { useState, useEffect } from 'react';
import { useSocket } from './useContexts';
import { SOCKET_EVENTS } from '../utils/constants';
import { getTimeSeriesData } from '../utils/chartHelpers';

export const useRealtimeLogs = () => {
  const { on, off } = useSocket();
  const [logs, setLogs] = useState([]);
  const [newLogsCount, setNewLogsCount] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const handleNewLog = (log) => {
      setLogs((prev) => [log, ...prev]);
      setNewLogsCount((prev) => prev + 1);
    };

    const unsubscribe = on(SOCKET_EVENTS.LOG_NEW, handleNewLog);

    return () => {
      off(SOCKET_EVENTS.LOG_NEW, handleNewLog);
      unsubscribe?.();
    };
  }, [on, off]);

  useEffect(() => {
    setChartData(getTimeSeriesData(logs));
  }, [logs]);

  const clearNewLogs = () => {
    setNewLogsCount(0);
  };

  return {
    logs,
    setLogs,
    newLogsCount,
    chartData,
    clearNewLogs,
  };
};

export default useRealtimeLogs;
