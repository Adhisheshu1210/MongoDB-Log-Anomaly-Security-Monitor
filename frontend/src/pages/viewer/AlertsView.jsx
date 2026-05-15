import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, 
  AlertCircle, 
  Clock, 
  Filter, 
  ChevronRight, 
  ShieldCheck,
  Zap,
  Activity,
  History,
  Terminal,
  X,
  RefreshCw
} from 'lucide-react';

// --- PRODUCTION ALERTS DATASET BUFFER ---
const INITIAL_ALERTS = [
  { 
    id: "SEC-402", 
    title: "NoSQL Injection Attempt", 
    severity: "CRITICAL", 
    source: "mdb-shard-01", 
    time: "2m ago", 
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    type: "Injection",
    desc: "Recursive operator pattern detected in 'users' collection query.",
    payload: "{'username': {'$ne': null}, 'password': {'$gt': ''}}",
    mitre_technique: "T1190 - Exploit Public-Facing Application"
  },
  { 
    id: "SEC-398", 
    title: "Unusual Geo-Location Access", 
    severity: "HIGH", 
    source: "Auth-Service", 
    time: "15m ago", 
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    type: "Access Control",
    desc: "Administrative login detected from unauthorized region (RU).",
    payload: "User: admin_root | IP: 185.220.101.5 | ISP: Tor Exit Node",
    mitre_technique: "T1078.004 - Valid Accounts: Cloud Accounts"
  },
  { 
    id: "SEC-395", 
    title: "High-Frequency Schema Scan", 
    severity: "MEDIUM", 
    source: "mdb-shard-02", 
    time: "1h ago", 
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    type: "Discovery",
    desc: "Rapid 'listCollections' commands detected from a single source IP.",
    payload: "Command Count: 142/sec | Source IP: 45.133.192.12",
    mitre_technique: "T1046 - Network Service Discovery"
  }
];

const AlertsView = () => {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [inspectingAlert, setInspectingAlert] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Background Telemetry Simulator (Feeds anomalies every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      
      const newAnomalies = [
        {
          id: `SEC-${Math.floor(Math.random() * 200) + 403}`,
          title: "Brute Force Threshold Exceeded",
          severity: "HIGH",
          source: "Gateway-Proxy",
          time: "Just now",
          timestamp: new Date().toISOString(),
          type: "Credential Access",
          desc: "42 consecutive failed validation challenges observed against API endpoints.",
          payload: "Target Endpoint: /api/v1/auth/session | Client Fingerprint verified",
          mitre_technique: "T1110.001 - Brute Force: Password Guessing"
        },
        {
          id: `SEC-${Math.floor(Math.random() * 200) + 600}`,
          title: "Heuristic Cryptomining Trace",
          severity: "CRITICAL",
          source: "k8s-pod-worker-3",
          time: "Just now",
          timestamp: new Date().toISOString(),
          type: "Execution",
          desc: "Strata stratum+tcp protocol activity signature registered by network filter.",
          payload: "Outbound Target: 139.99.123.45:4444 | Binary: /tmp/xmrig",
          mitre_technique: "T1496 - Resource Hijacking"
        }
      ];

      const chosenAnomaly = newAnomalies[Math.floor(Math.random() * newAnomalies.length)];
      
      setAlerts(prev => {
        if (prev.some(a => a.title === chosenAnomaly.title && chosenAnomaly.time === "Just now")) return prev;
        return [chosenAnomaly, ...prev];
      });

      toast(() => (
        <span className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
          <ShieldAlert className="text-rose-500 animate-pulse" size={14} /> 
          Inbound threat matrix detected: {chosenAnomaly.id}
        </span>
      ), {
        style: { background: '#020617', border: '1px solid #1e293b', padding: '10px 14px' }
      });

      setTimeout(() => setIsRefreshing(false), 800);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Compute live matrix counts directly from state
  const metrics = useMemo(() => {
    return alerts.reduce((acc, curr) => {
      if (curr.severity === 'CRITICAL') acc.critical++;
      if (curr.severity === 'HIGH') acc.high++;
      if (curr.severity === 'MEDIUM') acc.medium++;
      return acc;
    }, { critical: 0, high: 0, medium: 0 });
  }, [alerts]);

  // Handle multi-layered severity filters
  const filteredAlerts = useMemo(() => {
    if (selectedSeverity === 'ALL') return alerts;
    return alerts.filter(alert => alert.severity === selectedSeverity);
  }, [alerts, selectedSeverity]);

  const getSeverityStyle = (sev) => {
    switch(sev) {
      case 'CRITICAL': return 'border-l-rose-500 bg-rose-500/5 text-rose-400 border-rose-500/20';
      case 'HIGH': return 'border-l-orange-500 bg-orange-500/5 text-orange-400 border-orange-500/20';
      case 'MEDIUM': return 'border-l-amber-500 bg-amber-500/5 text-amber-400 border-amber-500/20';
      default: return 'border-l-slate-500 bg-slate-500/5 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen text-slate-100">
      
      {/* Header & Quick Summary */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-slate-900 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest">
            <ShieldAlert size={14} className="animate-pulse" /> Security Intelligence Channels
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Active Threats</h1>
          <p className="text-xs text-slate-500 font-mono">Real-time analysis cluster cross-examining microservice endpoints</p>
        </div>

        <div className="grid grid-cols-4 gap-3 w-full lg:w-auto">
          {[
            { label: 'All Logs', count: alerts.length, value: 'ALL', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5' },
            { label: 'Critical', count: metrics.critical, value: 'CRITICAL', color: 'text-rose-500 border-rose-500/30 bg-rose-500/5' },
            { label: 'High', count: metrics.high, value: 'HIGH', color: 'text-orange-500 border-orange-500/30 bg-orange-500/5' },
            { label: 'Medium', count: metrics.medium, value: 'MEDIUM', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => setSelectedSeverity(item.value)}
              className={`border p-3 rounded-xl min-w-[90px] sm:min-w-[110px] text-left transition-all hover:scale-[1.02] cursor-pointer ${item.color} ${selectedSeverity === item.value ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-slate-700' : 'opacity-60'}`}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
              <p className="text-xl font-black mt-1">{item.count}</p>
            </button>
          ))}
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/20 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono">
            <Filter size={13} className="text-slate-500" />
            <select 
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-slate-300 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL Matrix Only</option>
              <option value="HIGH">HIGH Thresholds</option>
              <option value="MEDIUM">MEDIUM Signals</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
            <Clock size={13} /> Last 24 Hours
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono self-end sm:self-auto">
          <RefreshCw size={12} className={`text-indigo-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          Auto-refreshing 30s
        </div>
      </div>

      {/* Main Grid View: List View + Inspection Drawer Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Alerts List Stack */}
        <div className={`space-y-4 ${inspectingAlert ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert, i) => (
              <motion.div 
                key={alert.id}
                layout
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => setInspectingAlert(alert)}
                className={`group relative border border-l-4 rounded-2xl p-5 transition-all hover:bg-slate-900/30 cursor-pointer ${getSeverityStyle(alert.severity)} ${inspectingAlert?.id === alert.id ? 'bg-slate-900/40 ring-1 ring-slate-700' : ''}`}
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-slate-700 transition-colors shrink-0">
                      <AlertCircle size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-400">{alert.id}</span>
                        <h3 className="text-base font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">{alert.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 max-w-2xl font-sans line-clamp-2 lg:line-clamp-none">{alert.desc}</p>
                      <div className="flex items-center gap-4 pt-1.5 font-mono">
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-500">
                          <Zap size={10} /> {alert.type}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-500">
                          <Activity size={10} /> {alert.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex lg:flex-col justify-between items-end shrink-0 border-t border-slate-900 lg:border-none pt-3 lg:pt-0">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                      <History size={12} /> {alert.time}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-400 group-hover:translate-x-1 transition-transform mt-auto">
                      Inspect Matrix <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 font-mono text-xs">
              Zero operational threats meet current query scope specifications.
            </div>
          )}
        </div>

        {/* Inspection Panel Drawer */}
        <AnimatePresence>
          {inspectingAlert && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5 sticky top-6 shadow-2xl xl:col-span-1"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-indigo-400" />
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Telemetry Decoder</h3>
                </div>
                <button 
                  onClick={() => setInspectingAlert(null)}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-400">{inspectingAlert.id}</span>
                <h2 className="text-lg font-black text-white tracking-tight">{inspectingAlert.title}</h2>
                <div className="inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 mt-1">
                  Severity: <span className="text-white font-black">{inspectingAlert.severity}</span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs border-t border-slate-900 pt-4">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-1">MITRE ATT&CK Matrix Alignment</h4>
                  <p className="p-2 bg-slate-900/50 rounded-lg text-slate-300 text-[11px] border border-slate-900">{inspectingAlert.mitre_technique || "N/A - General Anomaly Trace"}</p>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-1">Raw Payload Checkpoint Memory</h4>
                  <pre className="p-3 bg-slate-900 font-mono text-[10px] text-emerald-400 rounded-xl overflow-x-auto whitespace-pre-wrap break-all border border-slate-900">
                    <code>{inspectingAlert.payload || "No explicit raw byte streams available for this anomaly segment."}</code>
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 text-slate-400">
                  <div className="p-2 bg-slate-900/30 border border-slate-900 rounded-lg">
                    <span className="text-[9px] block text-slate-600 font-bold uppercase">Source Unit</span>
                    <span className="text-slate-200 font-bold">{inspectingAlert.source}</span>
                  </div>
                  <div className="p-2 bg-slate-900/30 border border-slate-900 rounded-lg">
                    <span className="text-[9px] block text-slate-600 font-bold uppercase">Signal Category</span>
                    <span className="text-slate-200 font-bold">{inspectingAlert.type}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Intelligence Feed Footer */}
      <footer className="mt-12 p-6 bg-slate-900/30 border border-slate-800 rounded-3xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="text-emerald-500 animate-pulse" size={18} />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Global Intelligence Sync</h4>
        </div>
        <p className="text-xs text-slate-500 font-mono leading-relaxed max-w-4xl">
          Security engines are securely polling global cross-referenced threat indicators. Signature matrices mapping to NoSQL structural anomalies 
          (such as those monitored on <span className="text-slate-300 font-bold">mdb shards</span>) automatically trigger internal security profiles 
          to throttle recursive payload evaluations without disrupting application stability.
        </p>
      </footer>
    </div>
  );
};

export default AlertsView;