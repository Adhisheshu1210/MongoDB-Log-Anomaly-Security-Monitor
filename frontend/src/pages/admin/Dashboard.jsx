import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Users, 
  ShieldAlert, 
  Database, 
  Server, 
  TrendingUp, 
  Settings,
  Activity,
  Zap,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import useRBAC from '../../hooks/useRBAC';
import { getDashboard } from '../../services/stats.service';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { can } = useRBAC();
  const canManageSettings = can('manage_settings');
  const canGenerateReports = can('generate_reports');
  const canViewAudit = can('view_audit_logs');

  // State Management
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalLogs: 0,
    totalAnomalies: 0,
    unresolvedAnomalies: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    siemDatasetTotal: 0,
    siemAnomaliesCount: 0,
    combinedTotalLogs: 0,
    combinedTotalAnomalies: 0,
    todayLogs: 0,
    todayAnomalies: 0,
    logsOverTime: [],
    anomaliesByType: [],
    bySeverity: [],
    byClassification: [],
    systemHealth: 99.9
  });

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Export Report Handler
  const handleExportReport = useCallback(async () => {
    if (!canGenerateReports) {
      toast.error('Permission denied: generate_reports required');
      return;
    }

    try {
      setExporting(true);
      const link = document.createElement('a');
      
      // Generate JSON report
      const reportData = {
        timestamp: new Date().toISOString(),
        reportTitle: 'System Security Dashboard Report',
        exportedBy: 'Admin Dashboard',
        summaryMetrics: {
          totalLogs: dashboardData.totalLogs,
          totalAnomalies: dashboardData.totalAnomalies,
          unresolvedAnomalies: dashboardData.unresolvedAnomalies,
          totalAlerts: dashboardData.totalAlerts,
          activeAlerts: dashboardData.activeAlerts,
          criticalAlerts: dashboardData.criticalAlerts,
          systemHealth: `${dashboardData.systemHealth.toFixed(2)}%`
        },
        siemDatasetMetrics: {
          totalRecords: dashboardData.siemDatasetTotal,
          anomaliesDetected: dashboardData.siemAnomaliesCount,
          combinedLogs: dashboardData.combinedTotalLogs,
          combinedAnomalies: dashboardData.combinedTotalAnomalies
        },
        dailyMetrics: {
          logsToday: dashboardData.todayLogs,
          anomaliesToday: dashboardData.todayAnomalies
        },
        analytics: {
          logsOverTime: dashboardData.logsOverTime,
          anomaliesByType: dashboardData.anomaliesByType,
          bySeverity: dashboardData.bySeverity,
          byClassification: dashboardData.byClassification
        }
      };

      const jsonString = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      link.href = URL.createObjectURL(blob);
      link.download = `admin-dashboard-report-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  }, [canGenerateReports, dashboardData]);

  // Global Config Handler
  const handleGlobalConfig = useCallback(() => {
    if (!canManageSettings) {
      toast.error('Permission denied: manage_settings required');
      return;
    }
    navigate('/admin/settings');
  }, [canManageSettings, navigate]);

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const stats = [
    { 
      label: 'Total Logs', 
      value: formatNumber(dashboardData.combinedTotalLogs), 
      change: `${dashboardData.todayLogs} today`,
      icon: Database, 
      color: 'text-blue-400' 
    },
    { 
      label: 'Active Threats', 
      value: dashboardData.activeAlerts,
      change: `${dashboardData.criticalAlerts} critical`,
      icon: ShieldAlert, 
      color: 'text-rose-500' 
    },
    { 
      label: 'Anomalies Detected', 
      value: formatNumber(dashboardData.combinedTotalAnomalies),
      change: `${dashboardData.unresolvedAnomalies} unresolved`,
      icon: AlertCircle, 
      color: 'text-amber-400' 
    },
    { 
      label: 'System Health', 
      value: `${dashboardData.systemHealth.toFixed(1)}%`, 
      change: 'Operational',
      icon: Zap, 
      color: 'text-emerald-400' 
    },
  ];

  // Prepare chart data
  const threatTrend = dashboardData.logsOverTime.map(item => ({
    name: item.time || 'N/A',
    count: item.count || 0
  })) || [];

  const anomalyData = dashboardData.anomaliesByType || [];
  const severityData = dashboardData.bySeverity || [];
  const classificationData = dashboardData.byClassification || [];

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-indigo-500" size={48} />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Admin Welcome Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Admin Command <span className="text-indigo-500 text-sm font-mono border border-indigo-500/30 px-2 py-0.5 rounded italic">v4.0.2</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Enterprise-wide security posture and system orchestration with live SIEM dataset integration.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGlobalConfig}
            disabled={!canManageSettings}
            title={canManageSettings ? 'Open global configuration' : 'Permission required: manage_settings'}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
              canManageSettings
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                : 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Settings size={16} /> Global Config
          </button>
          <button
            type="button"
            onClick={handleExportReport}
            disabled={!canGenerateReports || exporting}
            title={canGenerateReports ? 'Export JSON report' : 'Permission required: generate_reports'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              canGenerateReports
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 bg-slate-900/40 border border-slate-800 group hover:border-indigo-500/50 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:bg-indigo-500/10 transition-colors ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-black text-slate-500">
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-2xl font-black text-white mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Logs Over Time Chart */}
        <div className="lg:col-span-8 card p-6 bg-slate-900/20 border border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-400" /> Security Ingress Analytics
              </h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Logs ingested over time (last 24 hours)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] text-slate-400 font-bold">Log Count</span>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={threatTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => formatNumber(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrastructure Health Ticker */}
        <div className="lg:col-span-4 space-y-6">
          {/* Service Health */}
          <div className="card p-6 bg-slate-900/40 border border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Service Health</h3>
            <div className="space-y-5">
              {[
                { name: 'MongoDB Cluster', status: 'Optimal', load: '12%', color: 'bg-emerald-500' },
                { name: 'Data Ingestion', status: 'Active', load: `${Math.min(100, (dashboardData.siemDatasetTotal / 100) % 100)}%`, color: 'bg-indigo-500' },
                { name: 'Anomaly Detection', status: 'Running', load: '42%', color: 'bg-amber-500' },
                { name: 'API Server', status: 'Optimal', load: '08%', color: 'bg-emerald-500' },
              ].map((service, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-300 uppercase">{service.name}</span>
                    <span className={service.color.replace('bg-', 'text-')}>{service.status}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: service.load }}
                      className={`h-full ${service.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIEM Dataset Statistics */}
          <div className="card p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">SIEM Dataset Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-[10px] text-slate-400">Total Records</span>
                <span className="text-[11px] font-black text-white">{formatNumber(dashboardData.siemDatasetTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-[10px] text-slate-400">Anomalies Found</span>
                <span className="text-[11px] font-black text-amber-400">{formatNumber(dashboardData.siemAnomaliesCount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-[10px] text-slate-400">Detection Rate</span>
                <span className="text-[11px] font-black text-emerald-400">
                  {dashboardData.siemDatasetTotal > 0 
                    ? `${((dashboardData.siemAnomaliesCount / dashboardData.siemDatasetTotal) * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] text-slate-400">Last Updated</span>
                <span className="text-[9px] text-slate-500">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Anomalies by Type */}
        {anomalyData.length > 0 && (
          <div className="card p-6 bg-slate-900/20 border border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={16} className="text-indigo-400" /> Anomalies by Type
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={anomalyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {anomalyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #1e293b', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => formatNumber(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Severity Distribution */}
        {severityData.length > 0 && (
          <div className="card p-6 bg-slate-900/20 border border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400" /> Severity Distribution
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #1e293b', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => formatNumber(value)}
                  />
                  <Bar dataKey="value" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Classification Data */}
      {classificationData.length > 0 && (
        <div className="card p-6 bg-slate-900/20 border border-slate-800">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Database size={16} className="text-cyan-400" /> Classification Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {classificationData.slice(0, 6).map((item, i) => (
              <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">{item.name || 'Unknown'}</p>
                <p className="text-xl font-black text-indigo-400">{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;