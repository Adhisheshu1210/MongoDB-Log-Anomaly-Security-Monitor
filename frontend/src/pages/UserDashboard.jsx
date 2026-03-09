import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { statsAPI, systemAPI } from '../services/api';
import {
  FileText,
  AlertTriangle,
  Bell,
  Activity,
  TrendingUp,
  Clock,
  RefreshCw,
  Server,
  Cpu,
  HardDrive
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#00ff88', '#ff3366', '#ffaa00', '#00aaff', '#9933ff', '#ff66aa'];

const UserDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [logsByLevel, setLogsByLevel] = useState([]);
  const [logsByTime, setLogsByTime] = useState([]);
  const [anomaliesByType, setAnomaliesByType] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const { socket } = useSocket();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        logsByLevelRes,
        logsByTimeRes,
        anomaliesByTypeRes,
        metricsRes
      ] = await Promise.all([
        statsAPI.getDashboard(),
        statsAPI.getLogsByLevel(),
        statsAPI.getLogsByTime({ limit: 24 }),
        statsAPI.getAnomaliesByType(),
        systemAPI.getMetrics()
      ]);

      setStats(statsRes.data.data);
      setLogsByLevel(logsByLevelRes.data.data);
      setLogsByTime(logsByTimeRes.data.data);
      setAnomaliesByType(anomaliesByTypeRes.data.data);
      setMetrics(metricsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (log) => {
      setRecentLogs(prev => [log, ...prev.slice(0, 9)]);
      fetchDashboardData();
    };

    const handleNewAnomaly = (anomaly) => {
      setRecentAnomalies(prev => [anomaly, ...prev.slice(0, 4)]);
      toast.custom((t) => (
        <div className={`bg-cyber-card border border-cyber-danger rounded-lg p-4 shadow-lg ${t.visible ? 'animate-slide-in' : ''}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-cyber-danger" />
            <div>
              <p className="font-medium text-white">Anomaly Detected</p>
              <p className="text-sm text-gray-400">{anomaly.title}</p>
            </div>
          </div>
        </div>
      ));
    };

    const handleNewAlert = (alert) => {
      setActiveAlerts(prev => [alert, ...prev.slice(0, 9)]);
    };

    socket.on('log:new', handleNewLog);
    socket.on('anomaly:detected', handleNewAnomaly);
    socket.on('alert:new', handleNewAlert);

    return () => {
      socket.off('log:new', handleNewLog);
      socket.off('anomaly:detected', handleNewAnomaly);
      socket.off('alert:new', handleNewAlert);
    };
  }, [socket, fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getSeverityClass = (severity) => {
    const classes = {
      FATAL: 'log-fatal',
      ERROR: 'log-error',
      WARNING: 'log-warning',
      INFO: 'log-info',
      DEBUG: 'log-debug',
      TRACE: 'log-trace'
    };
    return classes[severity] || 'text-gray-400';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyber-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Developer Dashboard</h2>
          <p className="text-gray-400">Monitor logs, anomalies, and system performance</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-outline flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Logs</p>
              <p className="text-2xl font-bold text-white">{stats?.totalLogs?.toLocaleString() || 0}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-accent/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-cyber-accent" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-cyber-success">
            <TrendingUp className="w-4 h-4" />
            <span>{stats?.todayLogs || 0} today</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Anomalies</p>
              <p className="text-2xl font-bold text-white">{stats?.unresolvedAnomalies || 0}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-danger/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-cyber-danger" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
            <Activity className="w-4 h-4" />
            <span>{stats?.todayAnomalies || 0} detected today</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Alerts</p>
              <p className="text-2xl font-bold text-white">{stats?.activeAlerts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-warning/10 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-cyber-warning" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-cyber-danger">
            <AlertTriangle className="w-4 h-4" />
            <span>{stats?.criticalAlerts || 0} critical</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Logs/Hour</p>
              <p className="text-2xl font-bold text-white">{stats?.lastHourLogs || 0}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-info/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-cyber-info" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
            <Activity className="w-4 h-4" />
            <span>{stats?.lastHourAnomalies || 0} anomalies</span>
          </div>
        </div>
      </div>

      {/* System Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyber-accent" />
              <span className="text-gray-400 text-sm">CPU</span>
            </div>
            <span className={`text-sm font-medium ${metrics?.cpu?.usage > 80 ? 'text-cyber-danger' : 'text-cyber-success'}`}>
              {metrics?.cpu?.usage?.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-cyber-border rounded-full h-2">
            <div 
              className="bg-cyber-accent h-2 rounded-full" 
              style={{ width: `${metrics?.cpu?.usage || 0}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyber-info" />
              <span className="text-gray-400 text-sm">Memory</span>
            </div>
            <span className={`text-sm font-medium ${metrics?.memory?.usagePercent > 80 ? 'text-cyber-danger' : 'text-cyber-success'}`}>
              {metrics?.memory?.usagePercent?.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-cyber-border rounded-full h-2">
            <div 
              className="bg-cyber-info h-2 rounded-full" 
              style={{ width: `${metrics?.memory?.usagePercent || 0}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cyber-warning" />
              <span className="text-gray-400 text-sm">Disk</span>
            </div>
            <span className="text-sm font-medium text-cyber-success">65%</span>
          </div>
          <div className="w-full bg-cyber-border rounded-full h-2">
            <div className="bg-cyber-warning h-2 rounded-full" style={{ width: '65%' }} />
          </div>
        </div>

        {/* Uptime */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyber-accent" />
              <span className="text-gray-400 text-sm">Uptime</span>
            </div>
            <span className="text-sm font-medium text-white">
              {metrics?.system?.uptime ? Math.floor(metrics.system.uptime / 3600) + 'h' : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs Over Time */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Logs Over Time (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={logsByTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="_id" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Line type="monotone" dataKey="count" stroke="#00ff88" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Logs by Severity */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Logs by Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={logsByLevel}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="_id"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {logsByLevel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomalies by Type */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Anomalies by Type</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={anomaliesByType} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis type="number" stroke="#6b7280" fontSize={12} />
            <YAxis dataKey="_id" type="category" stroke="#6b7280" fontSize={12} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Bar dataKey="count" fill="#ff3366" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logs */}
        <div className="card">
          <div className="p-4 border-b border-cyber-border">
            <h3 className="text-lg font-semibold text-white">Recent Logs</h3>
          </div>
          <div className="divide-y divide-cyber-border max-h-80 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="p-4 text-gray-400 text-center">No logs yet</p>
            ) : (
              recentLogs.map((log, index) => (
                <div key={log._id || index} className="p-3 hover:bg-cyber-border/30">
                  <div className="flex items-start gap-3">
                    <div className={`severity-indicator severity-${log.severity?.toLowerCase()}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium uppercase ${getSeverityClass(log.severity)}`}>
                          {log.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 truncate mt-1">{log.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{log.component}</span>
                        {log.isAnomaly && (
                          <span className="badge badge-high">Anomaly</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Anomalies */}
        <div className="card">
          <div className="p-4 border-b border-cyber-border">
            <h3 className="text-lg font-semibold text-white">Recent Anomalies</h3>
          </div>
          <div className="divide-y divide-cyber-border max-h-80 overflow-y-auto">
            {recentAnomalies.length === 0 ? (
              <p className="p-4 text-gray-400 text-center">No anomalies detected</p>
            ) : (
              recentAnomalies.map((anomaly, index) => (
                <div key={anomaly._id || index} className="p-3 hover:bg-cyber-border/30">
                  <div className="flex items-start gap-3">
                    <div className={`severity-indicator severity-${anomaly.severity}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`badge badge-${anomaly.severity}`}>
                          {anomaly.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(anomaly.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium mt-1">{anomaly.title}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{anomaly.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-cyber-border text-gray-400">
                          {anomaly.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          Score: {(anomaly.anomalyScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-cyber-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
            <span className="badge badge-critical">{activeAlerts.length} Active</span>
          </div>
          <div className="divide-y divide-cyber-border">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert._id} className="p-3 hover:bg-cyber-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-cyber-warning" />
                    <div>
                      <p className="text-sm text-white">{alert.title}</p>
                      <p className="text-xs text-gray-400">{alert.message}</p>
                    </div>
                  </div>
                  <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

