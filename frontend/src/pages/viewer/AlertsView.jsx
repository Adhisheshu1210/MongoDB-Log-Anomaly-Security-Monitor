import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  AlertCircle, 
  Clock, 
  Filter, 
  ChevronRight, 
  Info,
  ShieldCheck,
  Zap,
  Activity,
  History
} from 'lucide-react';

const AlertsView = () => {
  const alerts = [
    { 
      id: "SEC-402", 
      title: "NoSQL Injection Attempt", 
      severity: "CRITICAL", 
      source: "mdb-shard-01", 
      time: "2m ago", 
      type: "Injection",
      desc: "Recursive operator pattern detected in 'users' collection query." 
    },
    { 
      id: "SEC-398", 
      title: "Unusual Geo-Location Access", 
      severity: "HIGH", 
      source: "Auth-Service", 
      time: "15m ago", 
      type: "Access Control",
      desc: "Administrative login detected from unauthorized region (RU)." 
    },
    { 
      id: "SEC-395", 
      title: "High-Frequency Schema Scan", 
      severity: "MEDIUM", 
      source: "mdb-shard-02", 
      time: "1h ago", 
      type: "Discovery",
      desc: "Rapid 'listCollections' commands detected from a single source IP." 
    }
  ];

  const getSeverityStyle = (sev) => {
    switch(sev) {
      case 'CRITICAL': return 'border-l-rose-500 bg-rose-500/5 text-rose-500';
      case 'HIGH': return 'border-l-orange-500 bg-orange-500/5 text-orange-500';
      case 'MEDIUM': return 'border-l-amber-500 bg-amber-500/5 text-amber-500';
      default: return 'border-l-slate-500 bg-slate-500/5 text-slate-400';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header & Quick Summary */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest">
            <ShieldAlert size={14} /> Security Intelligence
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Active Threats</h1>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full lg:w-auto">
          {[
            { label: 'Critical', count: 1, color: 'text-rose-500' },
            { label: 'High', count: 4, color: 'text-orange-500' },
            { label: 'Medium', count: 12, color: 'text-amber-500' },
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl min-w-[100px]">
              <p className="text-[9px] font-bold text-slate-500 uppercase">{item.label}</p>
              <p className={`text-xl font-black ${item.color}`}>{item.count}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/20 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
            <Filter size={14} /> Filter by Severity
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
            <Clock size={14} /> Last 24 Hours
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hidden md:block">
          Auto-refreshing every 30s
        </span>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert, i) => (
          <motion.div 
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`group relative border border-slate-800 border-l-4 rounded-2xl p-6 transition-all hover:bg-slate-900/40 ${getSeverityStyle(alert.severity)}`}
          >
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-current transition-colors`}>
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{alert.id}</span>
                    <h3 className="text-lg font-bold text-white tracking-tight">{alert.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400 max-w-2xl">{alert.desc}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500">
                      <Zap size={10} /> {alert.type}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500">
                      <Activity size={10} /> {alert.source}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <History size={12} /> {alert.time}
                </span>
                <button
                  type="button"
                  disabled
                  title="Viewer role is read-only"
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-not-allowed"
                >
                  View Logic <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Intelligence Feed Footer */}
      <footer className="mt-12 p-6 bg-slate-900/30 border border-slate-800 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="text-emerald-500" size={18} />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Global Intelligence Sync</h4>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
          Sentinel AI is currently cross-referencing your local logs with the 
          <span className="text-indigo-400 px-1">Global Threat Database (GTD)</span>. 
          Patterns detected in <span className="text-white">SEC-402</span> align with recent campaigns targeting MongoDB 6.x instances.
        </p>
      </footer>
    </div>
  );
};

export default AlertsView;