import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { statsAPI } from '../../services/api';
import { normalizeRole } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  Bell,
  Cpu,
  TrendingUp,
  Shield,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// --- Constants & Helpers ---

const neon = {
  cyan: '#00aaff',
  mint: '#00ff88',
  amber: '#ffaa00',
  red: '#ff3366',
  purple: '#9933ff',
  pink: '#ff66aa',
};

const formatCompact = (n) => {
  if (n === null || n === undefined) return '0';
  return new Intl.NumberFormat(undefined, { 
    notation: 'compact', 
    maximumFractionDigits: 1 
  }).format(n);
};

// --- Sub-Components ---

const TrendPill = ({ dir = 'up', value = 0 }) => {
  const isUp = dir === 'up';
  const cls = isUp ? 'text-emerald-400' : 'text-rose-400';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-slate-900/50 border border-slate-800 ${cls}`}>
      <TrendingUp className={`w-3 h-3 ${isUp ? '' : 'rotate-180'}`} />
      {value.toFixed(1)}%
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, trendDir, trendValue, pulseColorClass, subLabel }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl overflow-hidden group"
    >
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full ${pulseColorClass} blur-[80px]`} />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-700/30">
            <Icon className={`w-6 h-6 ${pulseColorClass.replace('bg-', 'text-')}`} />
          </div>
          <TrendPill dir={trendDir} value={trendValue} />
        </div>

        <div className="mt-6">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tabular-nums">
            {typeof value === 'number' ? formatCompact(value) : value}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">{subLabel}</p>
        </div>
      </div>
      
      {/* Bottom accent glow */}
      <div className={`absolute bottom-0 left-0 h-[2px] w-full ${pulseColorClass} opacity-30 group-hover:opacity-100 transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)]`} />
    </motion.div>
  );
};

// --- Main Dashboard Component ---

const Dashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const currentRole = normalizeRole(user?.role);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLogs: 0,
    siemDatasetTotal: 0,
    combinedTotalLogs: 0,
    anomaliesCount: 0,
    siemAnomaliesCount: 0,
    combinedTotalAnomalies: 0,
    activeAlerts: 0,
    systemHealth: 99.9,
    logsOverTime: [],
    anomaliesByType: [],
    bySeverity: [],
    byClassification: []
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await statsAPI.getDashboard();
      setStats(response.data?.data || response.data || {});
      setLoading(false);
    } catch (err) {
      toast.error('Sync failed: Could not reach Kafka service');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    if (socket) {
      socket.on('log:new', () => {
        setStats(prev => ({ ...prev, totalLogs: prev.totalLogs + 1 }));
      });
      
      socket.on('anomaly:detected', (data) => {
        setStats(prev => ({ 
          ...prev, 
          anomaliesCount: prev.anomaliesCount + 1,
          activeAlerts: prev.activeAlerts + 1
        }));
        toast.error(`Anomaly Detected: ${data.type}`, {
          icon: '🚨',
          style: { borderRadius: '10px', background: '#0f172a', color: '#fff', border: '1px solid #ff3366' }
        });
      });

      return () => {
        socket.off('log:new');
        socket.off('anomaly:detected');
      };
    }
  }, [socket, fetchStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-mono text-xs tracking-widest animate-pulse uppercase">Establishing Secure Stream...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {currentRole === 'admin' ? 'Admin Command Node' : 'Operations Command Node'}
            </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Security Overview</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg hidden lg:block">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Kafka Status</span>
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
            </span>
          </div>
          <button onClick={fetchStats} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20">
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Ingestion"
          value={stats.combinedTotalLogs || stats.totalLogs}
          icon={Activity}
          trendDir="up"
          trendValue={14.2}
          pulseColorClass="bg-indigo-500"
          subLabel={`${stats.totalLogs} core + ${stats.siemDatasetTotal} SIEM`}
        />
        <StatCard
          title="Detected Anomalies"
          value={stats.combinedTotalAnomalies || stats.anomaliesCount}
          icon={AlertTriangle}
          trendDir="down"
          trendValue={2.4}
          pulseColorClass="bg-rose-500"
          subLabel={`${stats.anomaliesCount} core + ${stats.siemAnomaliesCount} SIEM`}
        />
        <StatCard
          title="Security Alerts"
          value={stats.activeAlerts}
          icon={Bell}
          trendDir="up"
          trendValue={0.5}
          pulseColorClass="bg-amber-500"
          subLabel="Pending analyst verification"
        />
        <StatCard
          title="Cluster Health"
          value={`${stats.systemHealth}%`}
          icon={Shield}
          trendDir="up"
          trendValue={0.1}
          pulseColorClass="bg-mint-500"
          subLabel="MongoDB node uptime status"
        />
      </div>

      {/* Security Intelligence - Active Threats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Threats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Security Intelligence
            </h3>
          </div>
          
          <div className="space-y-4">
            {/* Total Threats */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Active Threats</p>
              <h4 className="text-4xl font-black text-white">{stats.activeAlerts || 0}</h4>
            </div>

            {/* Threat Breakdown by Severity */}
            <div className="grid grid-cols-3 gap-3">
              {/* Critical */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-center"
              >
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Critical</p>
                <h5 className="text-2xl font-black text-rose-400 mt-1">
                  {stats.bySeverity?.find(s => s.name === 'critical')?.value || 0}
                </h5>
              </motion.div>

              {/* High */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center"
              >
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">High</p>
                <h5 className="text-2xl font-black text-amber-400 mt-1">
                  {stats.bySeverity?.find(s => s.name === 'high')?.value || 0}
                </h5>
              </motion.div>

              {/* Medium */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center"
              >
                <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">Medium</p>
                <h5 className="text-2xl font-black text-yellow-400 mt-1">
                  {stats.bySeverity?.find(s => s.name === 'medium')?.value || 0}
                </h5>
              </motion.div>
            </div>

            {/* Low Severity */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Low</p>
                <h5 className="text-xl font-bold text-emerald-400">
                  {stats.bySeverity?.find(s => s.name === 'low')?.value || 0}
                </h5>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Threat Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <h3 className="text-lg font-bold text-white mb-6">Threat Level Distribution</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(stats.bySeverity || []).filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(stats.bySeverity || []).map((entry, index) => {
                    const severityColors = {
                      critical: neon.red,
                      high: neon.amber,
                      medium: '#fbbf24',
                      low: '#10b981'
                    };
                    return <Cell key={`cell-${index}`} fill={severityColors[entry.name] || neon.cyan} stroke="none" />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Display */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Throughput Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 p-6 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Ingestion Throughput</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500/20 border border-indigo-500" />
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.logsOverTime || []}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={neon.cyan} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={neon.cyan} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke={neon.cyan} strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Breakdown Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <h3 className="text-lg font-bold text-white mb-8">Anomaly Distribution</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.anomaliesByType || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {(stats.anomaliesByType || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[neon.purple, neon.pink, neon.cyan, neon.amber][index % 4]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;