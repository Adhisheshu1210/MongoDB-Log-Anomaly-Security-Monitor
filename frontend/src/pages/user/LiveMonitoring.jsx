import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Zap,
  AlertTriangle,
  TrendingUp,
  Bell,
  RefreshCw,
  BarChart3,
  Gauge,
  Table2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { statsAPI, logsAPI, anomaliesAPI, alertsAPI, siemDatasetAPI } from '../../services/api';

const neon = {
  cyan: '#00aaff',
  mint: '#00ff88',
  amber: '#ffaa00',
  red: '#ff3366',
  purple: '#9933ff',
};

const LiveMonitoring = () => {
  const { socket } = useSocket();
  const [realTimeData, setRealTimeData] = useState({
    logsPerSecond: 0,
    anomaliesPerMinute: 0,
    alertsActive: 0,
    cpuUsage: 45,
    memoryUsage: 62,
    databaseLatency: 12,
    throughput: []
  });

  const [metrics, setMetrics] = useState({
    recentLogs: 0,
    recentAnomalies: 0,
    recentAlerts: 0,
    avgResponseTime: 0
  });

  // SIEM preview (SiemDatasetRecord)
  const [siemPreviewLoading, setSiemPreviewLoading] = useState(true);
  const [siemPreviewError, setSiemPreviewError] = useState(null);
  const [siemPreviewRecords, setSiemPreviewRecords] = useState([]);

  const fetchSiemPreview = useCallback(async () => {
    setSiemPreviewLoading(true);
    setSiemPreviewError(null);

    try {
      // Use ALL fetched data on this page: fetch up to backend cap (500)
      // and render all returned rows.
      const res = await siemDatasetAPI.getAll({
        page: 1,
        limit: 500
      });

      setSiemPreviewRecords(res.data?.data || []);
    } catch (e) {
      setSiemPreviewError(e?.response?.data?.message || 'Failed to load SIEM dataset preview');
    } finally {
      setSiemPreviewLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const [dashboardRes, logsRes, anomaliesRes, alertsRes] = await Promise.all([
        statsAPI.getDashboard(),
        logsAPI.getAll({ limit: 1 }),
        anomaliesAPI.getAll({ limit: 1 }),
        alertsAPI.getAll({ limit: 1 })
      ]);

      const dashboard = dashboardRes.data?.data || {};
      setMetrics({
        recentLogs: dashboard.lastHourLogs || 0,
        recentAnomalies: dashboard.lastHourAnomalies || 0,
        recentAlerts: dashboard.activeAlerts || 0,
        avgResponseTime: Math.random() * 50 + 5
      });

      // Simulate real-time data
      setRealTimeData(prev => ({
        ...prev,
        logsPerSecond: Math.floor(Math.random() * 100 + 50),
        anomaliesPerMinute: Math.floor(Math.random() * 10 + 2),
        alertsActive: dashboard.activeAlerts || 0,
        cpuUsage: Math.floor(Math.random() * 40 + 30),
        memoryUsage: Math.floor(Math.random() * 30 + 50),
        databaseLatency: Math.floor(Math.random() * 20 + 5),
        throughput: [
          ...prev.throughput,
          {
            time: new Date().toLocaleTimeString(),
            logs: Math.floor(Math.random() * 500 + 300),
            anomalies: Math.floor(Math.random() * 20 + 5)
          }
        ].slice(-20)
      }));
    } catch (error) {
      toast.error('Failed to fetch live metrics');
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchSiemPreview();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics, fetchSiemPreview]);


  useEffect(() => {
    if (socket) {
      socket.on('log:new', () => {
        setRealTimeData(prev => ({
          ...prev,
          logsPerSecond: prev.logsPerSecond + 1
        }));
      });

      socket.on('anomaly:detected', () => {
        setRealTimeData(prev => ({
          ...prev,
          anomaliesPerMinute: prev.anomaliesPerMinute + 1
        }));
      });

      socket.on('alert:new', () => {
        setRealTimeData(prev => ({
          ...prev,
          alertsActive: prev.alertsActive + 1
        }));
      });

      return () => {
        socket.off('log:new');
        socket.off('anomaly:detected');
        socket.off('alert:new');
      };
    }
  }, [socket]);

  const MetricCard = ({ icon: Icon, label, value, unit, color, isAlert }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border backdrop-blur-xl ${
        isAlert
          ? 'bg-rose-500/10 border-rose-500/20'
          : 'bg-slate-900/40 border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${isAlert ? 'bg-rose-500/20' : 'bg-slate-950'}`}>
          <Icon className={`w-6 h-6 ${isAlert ? 'text-rose-500' : color}`} />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${isAlert ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
          LIVE
        </span>
      </div>
      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{label}</p>
      <h3 className="text-3xl font-bold text-white mt-2 tabular-nums">
        {typeof value === 'number' ? value.toFixed(value < 100 ? 1 : 0) : value}
        <span className="text-sm text-slate-400 ml-2">{unit}</span>
      </h3>
    </motion.div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-Time Monitoring</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Live Monitoring</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time system metrics and event stream</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Activity}
          label="Logs Per Second"
          value={realTimeData.logsPerSecond}
          unit="logs/sec"
          color="text-cyan-400"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Anomalies Per Minute"
          value={realTimeData.anomaliesPerMinute}
          unit="anomalies/min"
          color="text-amber-400"
          isAlert={realTimeData.anomaliesPerMinute > 5}
        />
        <MetricCard
          icon={Bell}
          label="Active Alerts"
          value={realTimeData.alertsActive}
          unit="alerts"
          color="text-rose-400"
          isAlert={realTimeData.alertsActive > 5}
        />
        <MetricCard
          icon={Gauge}
          label="Database Latency"
          value={realTimeData.databaseLatency}
          unit="ms"
          color="text-emerald-400"
        />
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> CPU Usage
            </h3>
            <span className={`text-2xl font-bold ${realTimeData.cpuUsage > 80 ? 'text-rose-500' : realTimeData.cpuUsage > 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {realTimeData.cpuUsage}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${realTimeData.cpuUsage}%` }}
              className={`h-full ${realTimeData.cpuUsage > 80 ? 'bg-rose-500' : realTimeData.cpuUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Memory Usage */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" /> Memory Usage
            </h3>
            <span className={`text-2xl font-bold ${realTimeData.memoryUsage > 85 ? 'text-rose-500' : realTimeData.memoryUsage > 70 ? 'text-amber-500' : 'text-cyan-500'}`}>
              {realTimeData.memoryUsage}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${realTimeData.memoryUsage}%` }}
              className={`h-full ${realTimeData.memoryUsage > 85 ? 'bg-rose-500' : realTimeData.memoryUsage > 70 ? 'bg-amber-500' : 'bg-cyan-500'}`}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Throughput Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800"
      >
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" /> System Throughput (Last 20 seconds)
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={realTimeData.throughput || []}>
              <defs>
                <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={neon.cyan} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={neon.cyan} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={neon.red} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={neon.red} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: `1px solid #1e293b`, borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Area type="monotone" dataKey="logs" stroke={neon.cyan} strokeWidth={2} fillOpacity={1} fill="url(#colorLogs)" />
              <Area type="monotone" dataKey="anomalies" stroke={neon.red} strokeWidth={2} fillOpacity={1} fill="url(#colorAnomalies)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* SIEM Dataset Preview */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Table2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">SIEM Dataset Preview</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fetched via <span className="font-mono text-slate-300">siemDatasetAPI.getAll</span> (rendering ALL fetched rows)
            </p>
          </div>
          <div className="text-right">
            {siemPreviewLoading ? (
              <span className="text-[10px] text-slate-500 font-mono">Loading...</span>
            ) : siemPreviewError ? (
              <span className="text-[10px] text-rose-400 font-mono">{String(siemPreviewError)}</span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">{siemPreviewRecords.length} rows</span>
            )}
          </div>
        </div>

        {siemPreviewLoading ? (
          <div className="py-10 text-center text-slate-500 font-mono text-xs">Loading SIEM dataset records...</div>
        ) : siemPreviewError ? (
          <div className="py-6 text-center text-rose-400 font-mono text-xs">{String(siemPreviewError)}</div>
        ) : siemPreviewRecords.length === 0 ? (
          <div className="py-6 text-center text-slate-500 font-mono text-xs">No SIEM dataset records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="pb-3 pr-4">Row</th>
                  <th className="pb-3 pr-4">Timestamp</th>
                  <th className="pb-3 pr-4">Severity</th>
                  <th className="pb-3 pr-4">Classification</th>
                  <th className="pb-3 pr-4">Anomaly</th>
                  <th className="pb-3 pr-4">Source</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {siemPreviewRecords.map((rec, idx) => (
                  <tr key={rec.id || idx} className="border-t border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-300">{rec.rowIdx ?? idx + 1}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-300">
                      {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[11px] px-2 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-200">
                        {rec.severity || '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-200 text-xs">{rec.classification || '-'}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full border ${
                          rec.isAnomaly ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        }`}
                      >
                        {rec.isAnomaly ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-200 text-xs">{rec.source || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Last Hour Logs', value: metrics.recentLogs, icon: Activity, color: 'text-cyan-400' },
          { label: 'Last Hour Anomalies', value: metrics.recentAnomalies, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Pending Alerts', value: metrics.recentAlerts, icon: Bell, color: 'text-rose-400' },
          { label: 'Avg Response', value: `${metrics.avgResponseTime.toFixed(2)}ms`, icon: TrendingUp, color: 'text-emerald-400' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-center"
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-xs text-slate-500 uppercase font-bold">{stat.label}</p>
            <h4 className="text-2xl font-bold text-white mt-1">{stat.value}</h4>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LiveMonitoring;
