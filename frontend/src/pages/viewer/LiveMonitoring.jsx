import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Terminal, 
  Wifi, 
  Database, 
  Activity, 
  Cpu, 
  Globe,
  Zap,
  Lock
} from 'lucide-react';

const LiveMonitoring = () => {
  const [logs, setLogs] = useState([]);
  const [isLive, setIsLive] = useState(true);

  // Simulation of incoming socket events
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        node: `mdb-shard-0${Math.floor(Math.random() * 4) + 1}`,
        op: ["QUERY", "UPDATE", "INSERT", "COMMAND", "AUTH"][Math.floor(Math.random() * 5)],
        latency: `${Math.floor(Math.random() * 150) + 10}ms`,
        status: Math.random() > 0.9 ? "DEGRADED" : "OPTIMAL",
        message: [
          "Index scan optimization triggered",
          "Secondary node heart-beat received",
          "OIDC Token verification successful",
          "Read preference: primaryPreferred",
          "Connection pool capacity reached"
        ][Math.floor(Math.random() * 5)]
      };

      setLogs(prev => [newLog, ...prev].slice(0, 15));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen font-mono">
      
      {/* Realtime Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-rose-500 animate-ping' : 'bg-slate-600'} absolute top-0 left-0`} />
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-slate-600'} relative`} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" /> Ingestion Stream
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Live Telemetry: Node Cluster Gamma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Packet Loss: 0.002%</span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase">Socket Status: Active</span>
          </div>
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
              isLive ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-indigo-500 text-white'
            }`}
          >
            {isLive ? "Pause Stream" : "Resume Stream"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Event Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Log</span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
            </div>

            <div className="p-4 h-[600px] overflow-y-auto space-y-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-4 p-3 bg-slate-900/30 border border-slate-800/50 rounded-lg hover:border-indigo-500/30 transition-colors group"
                  >
                    <span className="text-[10px] text-slate-600 font-bold w-20">{log.timestamp}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded border border-indigo-500/20 min-w-[60px] text-center">
                      {log.op}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold min-w-[80px]">{log.node}</span>
                    <span className="text-[11px] text-slate-300 flex-grow truncate">{log.message}</span>
                    <div className="flex items-center gap-4">
                      <span className={`text-[9px] font-bold ${log.status === 'DEGRADED' ? 'text-amber-500' : 'text-slate-600'}`}>
                        {log.latency}
                      </span>
                      <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'DEGRADED' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Node Monitoring & World Map Simulation */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Cluster Status Card */}
          <div className="card p-6 border-slate-800 bg-slate-900/40">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Database size={14} className="text-indigo-400" /> Active Shards
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Primary-Alpha', load: '42%', temp: '48°C' },
                { name: 'Secondary-Beta', load: '18%', temp: '42°C' },
                { name: 'Arbiter-Gamma', load: '2%', temp: '38°C' },
              ].map((shard, i) => (
                <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-slate-300">{shard.name}</span>
                    <span className="text-[9px] text-indigo-400 font-black">{shard.load}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500" 
                      initial={{ width: 0 }}
                      animate={{ width: shard.load }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Observation Card */}
          <div className="card p-6 bg-gradient-to-br from-indigo-950/20 to-slate-900 border-indigo-500/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={80} className="text-indigo-500" />
            </div>
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={14} fill="currentColor" /> Stream Intelligence
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Analyzing <span className="text-white">4.2k events/sec</span>. No significant entropy shifts detected in the last 600 cycles.
            </p>
            <div className="mt-4 pt-4 border-t border-indigo-500/10 flex justify-between">
              <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase">Entropy</p>
                <p className="text-sm font-bold text-white">0.024</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase">Risk Level</p>
                <p className="text-sm font-bold text-emerald-500">LOW</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase">Uptime</p>
                <p className="text-sm font-bold text-white">99.9%</p>
              </div>
            </div>
          </div>

          {/* View-Only Indicator */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-center gap-3">
             <Lock size={14} className="text-amber-500/50" />
             <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em]">Read-Only Observation State</span>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default LiveMonitoring;