import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Server, 
  Eye,
  Lock,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const ViewerDashboard = () => {
  // Mock Data for Viewers
  const healthData = [
    { time: '10:00', cpu: 45, mem: 60 },
    { time: '11:00', cpu: 52, mem: 62 },
    { time: '12:00', cpu: 48, mem: 65 },
    { time: '13:00', cpu: 70, mem: 68 },
    { time: '14:00', cpu: 55, mem: 64 },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Viewer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="text-amber-500" size={20} />
          <span className="text-xs font-bold text-amber-200 uppercase tracking-widest">
            Viewer Mode: Read-Only Access
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-slate-500" />
          <span className="text-[10px] text-slate-500 font-bold uppercase">Actions Disabled</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'System Health', value: '99.8%', icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Live Connections', value: '1,242', icon: Activity, color: 'text-cyan-400' },
          { label: 'Active Threats', value: '14', icon: AlertTriangle, color: 'text-rose-400' },
          { label: 'DB Cluster', value: 'Healthy', icon: Database, color: 'text-indigo-400' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 bg-slate-900/40 border border-slate-800"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-white">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-slate-950 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Monitoring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* System Performance (Area Chart) */}
        <div className="lg:col-span-8 card p-6 bg-slate-900/20 border border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Server size={16} className="text-indigo-400" /> Cluster Performance
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] text-slate-400 font-bold">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-[10px] text-slate-400 font-bold">MEM</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#6366f1" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={3} />
                <Area type="monotone" dataKey="mem" stroke="#22d3ee" fill="transparent" strokeWidth={3} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="lg:col-span-4 card p-6 bg-slate-900/20 border border-slate-800">
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Threat Distribution</h3>
           <div className="space-y-6">
              {[
                { type: 'Critical', count: 4, color: 'bg-rose-500', width: '25%' },
                { type: 'High', count: 12, color: 'bg-orange-500', width: '60%' },
                { type: 'Medium', count: 24, color: 'bg-amber-500', width: '85%' },
                { type: 'Low', count: 45, color: 'bg-emerald-500', width: '100%' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">{item.type}</span>
                    <span className="text-white">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: item.width }} />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ViewerDashboard;