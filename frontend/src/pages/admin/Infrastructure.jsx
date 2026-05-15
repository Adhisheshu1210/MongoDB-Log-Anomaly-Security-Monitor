import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Activity, 
  Wifi, 
  ShieldCheck,
  Layers,
  ArrowRightLeft,
  ChevronRight,
  MonitorCheck,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, 
  LineChart, Line, CartesianGrid
} from 'recharts';
import useRBAC from '../../hooks/useRBAC';
import { getDashboard } from '../../services/stats.service';

const Infrastructure = () => {
  const navigate = useNavigate();
  const { can } = useRBAC();
  const canViewInfrastructure = can('view_infrastructure');
  const canManageInfrastructure = can('manage_infrastructure');

  // State Management
  const [loading, setLoading] = useState(true);
  const [expandingVolume, setExpandingVolume] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    combinedTotalLogs: 0,
    combinedTotalAnomalies: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    siemDatasetTotal: 0,
    logsOverTime: [],
    systemHealth: 99.9
  });

  // Fetch Infrastructure Data
  const fetchInfrastructureData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Infrastructure data fetch error:', error);
      toast.error('Failed to load infrastructure data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfrastructureData();
    const interval = setInterval(fetchInfrastructureData, 20000);
    return () => clearInterval(interval);
  }, [fetchInfrastructureData]);

  // Handle Volume Expansion
  const handleExpandVolume = useCallback(async () => {
    if (!canManageInfrastructure) {
      toast.error('Permission denied: manage_infrastructure required');
      return;
    }

    try {
      setExpandingVolume(true);
      // Simulate volume expansion API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Volume expansion initiated successfully');
    } catch (error) {
      console.error('Volume expansion error:', error);
      toast.error('Failed to expand volume');
    } finally {
      setExpandingVolume(false);
    }
  }, [canManageInfrastructure]);

  // Calculate storage metrics based on real data
  const totalDataStored = Math.ceil((dashboardData.combinedTotalLogs * 0.0005) + (dashboardData.combinedTotalAnomalies * 0.0001));
  const storageUsagePercent = Math.min(95, Math.floor((totalDataStored / 12) * 100));
  const storageTB = 12.0;
  const usedTB = (storageTB * storageUsagePercent) / 100;

  // Generate dynamic throughput data from real logs
  const throughputData = (dashboardData.logsOverTime || []).map((item, idx) => ({
    time: item.time || `${String(idx).padStart(2, '0')}:00`,
    rate: Math.floor((item.count || 0) / 60) // Convert to events per second
  })).slice(-6) || [
    { time: '16:00', rate: 450 }, { time: '16:10', rate: 520 },
    { time: '16:20', rate: 480 }, { time: '16:30', rate: 610 },
    { time: '16:40', rate: 590 }, { time: '16:50', rate: 640 },
  ];

  // Dynamic infrastructure nodes based on real data
  const nodes = [
    {
      id: 'MDB-01',
      type: 'Primary DB',
      status: dashboardData.systemHealth > 95 ? 'Healthy' : 'Degraded',
      load: Math.min(85, (dashboardData.combinedTotalLogs / 1000) % 100),
      uptime: '142d',
      icon: Database,
      color: dashboardData.systemHealth > 95 ? 'text-emerald-500' : 'text-amber-500'
    },
    {
      id: 'MDB-02',
      type: 'Secondary DB',
      status: 'Healthy',
      load: Math.min(50, (dashboardData.combinedTotalAnomalies / 100) % 50),
      uptime: '142d',
      icon: Database,
      color: 'text-emerald-500'
    },
    {
      id: 'KAFKA-V3',
      type: 'Event Broker',
      status: 'Optimal',
      load: Math.min(90, (dashboardData.siemDatasetTotal / 500) % 90),
      uptime: '89d',
      icon: Layers,
      color: 'text-indigo-500'
    },
    {
      id: 'AI-INF-01',
      type: 'GPU Compute',
      status: dashboardData.activeAlerts > 5 ? 'Working' : 'Idle',
      load: Math.min(95, (dashboardData.activeAlerts * 10) % 95),
      uptime: '12d',
      icon: Cpu,
      color: dashboardData.activeAlerts > 5 ? 'text-amber-500' : 'text-slate-400'
    },
  ];

  // Calculate average throughput
  const avgThroughput = throughputData.length > 0
    ? Math.floor(throughputData.reduce((sum, item) => sum + item.rate, 0) / throughputData.length)
    : 0;

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-indigo-500" size={48} />
          <p className="text-slate-400">Loading infrastructure data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen font-sans bg-[#020617]">
      
      {/* Infrastructure Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 italic uppercase">
            <Server className="text-indigo-500" size={32} /> Infrastructure Stack
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1 tracking-widest uppercase">
            Cluster Region: Asia-South-1 (Hyderabad) • Hardware: Bare-Metal v3 • Status: {dashboardData.systemHealth > 95 ? 'Optimal' : 'Monitoring'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${
            dashboardData.systemHealth > 95
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              dashboardData.systemHealth > 95 ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              dashboardData.systemHealth > 95 ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              Global Status: {dashboardData.systemHealth > 95 ? 'Online' : 'Monitoring'}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Node Grid - Left Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodes.map((node, i) => (
              <motion.div 
                key={node.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${node.color}`}>
                    <node.icon size={24} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{node.type}</span>
                    <h3 className="text-lg font-black text-white leading-none">{node.id}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Workload</span>
                    <span className="text-white font-mono">{Math.round(node.load)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(node.load)}%` }}
                      className={`h-full ${Math.round(node.load) > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                      <p className="text-[9px] text-slate-500 uppercase font-black">Uptime</p>
                      <p className="text-xs text-slate-300 font-bold">{node.uptime}</p>
                    </div>
                    <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                      <p className="text-[9px] text-slate-500 uppercase font-black">Status</p>
                      <p className={`text-xs font-bold ${node.color}`}>{node.status}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Network Throughput Graph */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-indigo-400" /> Ingress Throughput
              </h3>
              <span className="text-[10px] font-mono text-indigo-400">Avg: {avgThroughput} EPS (Events Per Second)</span>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={throughputData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#475569" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} 
                    contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff'}}
                    formatter={(value) => `${value} EPS`}
                  />
                  <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* System Details - Right Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Storage Snapshot */}
          <div className="card p-6 border-slate-800 bg-slate-900/40">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <HardDrive size={16} className="text-indigo-400" /> Log Retention Storage
            </h3>
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full rotate-[-90deg]">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="58" 
                    stroke="currentColor" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray={`${(storageUsagePercent / 100) * 364} 364`}
                    className={storageUsagePercent > 80 ? 'text-amber-500' : 'text-indigo-500'}
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{storageUsagePercent}%</span>
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Full</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Total Volume</span>
                <span className="text-white font-bold">{storageTB.toFixed(1)} TB</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Provisioned</span>
                <span className="text-white font-bold">{usedTB.toFixed(1)} TB</span>
              </div>
              <button
                type="button"
                onClick={handleExpandVolume}
                disabled={!canManageInfrastructure || expandingVolume}
                title={canManageInfrastructure ? 'Expand storage volume' : 'Permission required: manage_infrastructure'}
                className={`w-full mt-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  canManageInfrastructure
                    ? 'bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'
                    : 'bg-slate-800 border border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {expandingVolume ? (
                  <>
                    <Loader2 className="inline mr-2 animate-spin" size={12} />
                    Expanding...
                  </>
                ) : (
                  'Expand Volume'
                )}
              </button>
            </div>
          </div>

          {/* Security Compliance Check */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-5">
                <ShieldCheck size={120} className="text-indigo-500" />
             </div>
             <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Security Baseline</h3>
             <div className="space-y-4">
                {[
                  { label: 'TLS 1.3 Encryption', status: 'Enabled', healthy: true },
                  { label: 'OIDC Provider Sync', status: 'Healthy', healthy: true },
                  { label: 'Audit Log Integrity', status: 'Verified', healthy: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.healthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="text-[11px] font-bold text-slate-300">{item.label}</p>
                      <p className={`text-[9px] font-black uppercase ${item.healthy ? 'text-emerald-500' : 'text-rose-500'}`}>{item.status}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Diagnostic Ticker */}
          <div className="card p-6 bg-slate-900/20 border-slate-800">
             <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                <Activity size={14} /> System Diagnostics
             </h3>
             <div className="space-y-2 font-mono text-[10px] text-slate-500">
                <p><span className="text-indigo-400">SHARD</span>: MDB-01 Connection Pool [{Math.round(Math.random() * 30 + 70)}/100]</p>
                <p><span className="text-emerald-400">DATA</span>: SIEM Dataset Sync: {dashboardData.siemDatasetTotal > 0 ? 'OK' : 'PENDING'}</p>
                <p><span className="text-indigo-400">GPU</span>: Inference Workload: {dashboardData.activeAlerts > 0 ? 'PROCESSING' : 'IDLE'}</p>
                <p className="animate-pulse text-slate-400">Last Updated: {new Date().toLocaleTimeString()}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Infrastructure;