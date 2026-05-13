import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldAlert, 
  Database, 
  Cpu, 
  Server, 
  TrendingUp, 
  Globe,
  Settings,
  Activity,
  Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import useRBAC from '../../hooks/useRBAC';

const AdminDashboard = () => {
  const { can } = useRBAC();
  const canManageSettings = can('manage_settings');
  const canGenerateReports = can('generate_reports');
  const canViewAudit = can('view_audit_logs');

  // Mock Data for Analytics
  const threatTrend = [
    { name: 'Mon', threats: 12, anomalies: 45 },
    { name: 'Tue', threats: 19, anomalies: 52 },
    { name: 'Wed', threats: 15, anomalies: 48 },
    { name: 'Thu', threats: 22, anomalies: 70 },
    { name: 'Fri', threats: 30, anomalies: 65 },
    { name: 'Sat', threats: 10, anomalies: 30 },
    { name: 'Sun', threats: 8, anomalies: 25 },
  ];

  const stats = [
    { label: 'Total Users', value: '1,284', change: '+12%', icon: Users, color: 'text-blue-400' },
    { label: 'Active Threats', value: '14', change: '-2%', icon: ShieldAlert, color: 'text-rose-500' },
    { label: 'Data Ingested', value: '4.2 TB', change: '+18%', icon: Database, color: 'text-emerald-400' },
    { label: 'AI Confidence', value: '98.2%', change: '+0.4%', icon: Zap, color: 'text-amber-400' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Admin Welcome Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Admin Command <span className="text-indigo-500 text-sm font-mono border border-indigo-500/30 px-2 py-0.5 rounded italic">v4.0.2</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Enterprise-wide security posture and system orchestration.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!canManageSettings}
            title={canManageSettings ? 'Open global configuration' : 'Permission required: manage_settings'}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
              canManageSettings
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Settings size={16} /> Global Config
          </button>
          <button
            type="button"
            disabled={!canGenerateReports}
            title={canGenerateReports ? 'Export report' : 'Permission required: generate_reports'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
              canGenerateReports
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Export Report
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
              <span className={`text-[10px] font-black ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
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
        
        {/* Global Threat Trend */}
        <div className="lg:col-span-8 card p-6 bg-slate-900/20 border border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-400" /> Security Ingress Analytics
              </h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Log anomalies vs. Verified threats</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] text-slate-400 font-bold">Anomalies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] text-slate-400 font-bold">Threats</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threatTrend}>
                <defs>
                  <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="anomalies" stroke="#6366f1" fillOpacity={1} fill="url(#colorAnomalies)" strokeWidth={3} />
                <Line type="monotone" dataKey="threats" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrastructure Health Ticker */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 bg-slate-900/40 border border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Service Health</h3>
            <div className="space-y-5">
              {[
                { name: 'MongoDB Cluster', status: 'Optimal', load: '12%', color: 'bg-emerald-500' },
                { name: 'Kafka Ingestion', status: 'High Load', load: '84%', color: 'bg-amber-500' },
                { name: 'AI Inference Engine', status: 'Optimal', load: '22%', color: 'bg-emerald-500' },
                { name: 'Socket.IO Server', status: 'Optimal', load: '08%', color: 'bg-emerald-500' },
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

          {/* Recent Admin Audit Logs */}
          <div className="card p-6 bg-slate-950 border border-slate-800">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Admin Audit Trail</h3>
            <div className="space-y-4">
              {[
                { user: 'Srijith', action: 'Global Policy Update', time: '12m ago' },
                { user: 'System', action: 'Auto-Scaling Triggered', time: '45m ago' },
                { user: 'Admin_02', action: 'User Permissions Revoked', time: '2h ago' },
              ].map((audit, i) => (
                <div key={i} className="flex items-center gap-3 border-l-2 border-slate-800 pl-4 py-1">
                  <div>
                    <p className="text-[11px] text-white font-bold">{audit.action}</p>
                    <p className="text-[9px] text-slate-500 uppercase">{audit.user} • {audit.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={!canViewAudit}
              title={canViewAudit ? 'View full audit trail' : 'Permission required: view_audit_logs'}
              className={`w-full mt-6 py-2 border rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                canViewAudit
                  ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-700 cursor-not-allowed'
              }`}
            >
              View Full Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;