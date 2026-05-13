import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Info, 
  Terminal, 
  FileJson, 
  Zap, 
  ShieldCheck, 
  History,
  AlertCircle,
  Network,
  ExternalLink as ExternalLinkIcon,
  ChevronRight,
  ShieldAlert,
  Download
} from 'lucide-react';

const Investigations = () => {
  const [activeTab, setActiveTab] = useState('raw');

  const incidentData = {
    id: "INV-2026-0842",
    score: 92,
    type: "NoSQL Injection Attempt",
    collection: "crm_users",
    timestamp: "2026-05-13 15:20:04",
    status: "Active"
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            <span className="hover:text-indigo-400 cursor-pointer transition-colors">Anomalies</span>
            <ChevronRight size={10} />
            <span className="text-indigo-400">{incidentData.id}</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Forensic Investigation</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
            <Download size={14} /> Export Evidence
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20">
            <ShieldAlert size={14} /> Mark as Resolved
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 border-l-4 border-l-rose-500 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <AlertCircle className="text-rose-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{incidentData.type}</h2>
                  <p className="text-xs text-slate-500 font-mono">Isolation Forest Model v2.4 Detection</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-black text-rose-500">
                {incidentData.score}/100
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              High-frequency query detected targeting the <code className="text-indigo-400 font-mono">users</code> collection. 
              {/* FIXED LINE BELOW: Wrapped operator in a string template */}
              The payload contains recursive operator patterns <code className="text-rose-400 font-mono">{"{\"$gt\": \"\"}"}</code> which indicates a 
              schema enumeration attack trying to bypass authentication logic.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
            <div className="flex bg-slate-950/50 border-b border-slate-800">
              {['raw', 'timeline', 'network'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab} Data
                </button>
              ))}
            </div>

            <div className="p-6 min-h-[350px]">
              <AnimatePresence mode="wait">
                {activeTab === 'raw' && (
                  <motion.div 
                    key="raw"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <pre className="font-mono text-xs text-indigo-300/90 leading-relaxed overflow-x-auto bg-slate-950/80 p-5 rounded-xl border border-slate-800/50">
{`{
  "event_id": "kafka_0x4421",
  "collection": "${incidentData.collection}",
  "operation": "find",
  "query": {
    "username": { "$gt": "" },
    "password": { "$ne": null }
  },
  "origin_ip": "104.22.18.204",
  "timestamp": "${incidentData.timestamp}"
}`}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/20 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <Zap size={18} className="fill-indigo-400" />
              <h3 className="text-sm font-black uppercase tracking-widest">AI Agent Analysis</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "Behavior matches a known <strong>'Schema Enumeration'</strong> attempt. Recommend enforcing IP rate-limiting on node <span className="text-indigo-400">mdb-shard-01</span>."
                </p>
              </div>
              <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Execute IP Block
              </button>
            </div>
          </motion.div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Network size={14} className="text-cyan-400" /> Intelligence Context
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Origin IP: 104.22.18.204', sub: 'VPN Proxy Cluster' },
                { label: 'Collection: crm_users', sub: 'Critical Store' }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">{item.label}</span>
                    <ExternalLinkIcon size={12} className="text-slate-600 group-hover:text-indigo-400" />
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <ShieldCheck size={16} className="text-emerald-500 mr-2" />
            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Validated by Sentinel AI</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Investigations;