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
  Database,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// =======================================================
// SHARED 22 FORENSIC INCIDENT DATABASE MATRIX REFERENCE
// =======================================================
const CORE_INCIDENT_DATABASE = [
  { id: "INV-2026-0842", score: 92, type: "NoSQL Injection Attempt", collection: "crm_users", timestamp: "2026-05-13 15:20:04", severity: "High" },
  { id: "INV-2026-0843", score: 98, type: "Blind SQL Injection (Time-Based)", collection: "billing_ledgers", timestamp: "2026-05-13 15:44:12", severity: "Critical" },
  { id: "INV-2026-0844", score: 85, type: "Server-Side Request Forgery (SSRF)", collection: "media_attachments", timestamp: "2026-05-13 16:01:50", severity: "High" },
  { id: "INV-2026-0845", score: 79, type: "Stored XSS Payload Mutation", collection: "user_comments", timestamp: "2026-05-13 16:15:33", severity: "Medium" },
  { id: "INV-2026-0846", score: 94, type: "Path Traversal (LFI Attempt)", collection: "static_assets", timestamp: "2026-05-13 16:30:11", severity: "Critical" },
  { id: "INV-2026-0847", score: 87, type: "GraphQL Introspection Query Leak", collection: "api_gateway", timestamp: "2026-05-13 16:48:22", severity: "High" },
  { id: "INV-2026-0848", score: 96, type: "JWT Secret Key Brute-Force", collection: "auth_tokens", timestamp: "2026-05-13 17:02:00", severity: "Critical" },
  { id: "INV-2026-0849", score: 68, type: "IDOR Data Harvesting", collection: "invoice_records", timestamp: "2026-05-13 17:15:10", severity: "Medium" },
  { id: "INV-2026-0850", score: 89, type: "Command Injection via Metadata Exchange", collection: "image_transcoder", timestamp: "2026-05-13 17:40:44", severity: "High" },
  { id: "INV-2026-0851", score: 74, type: "Mass Assignment Mass Mutation", collection: "user_profiles", timestamp: "2026-05-13 17:59:01", severity: "Medium" },
  { id: "INV-2026-0852", score: 99, type: "Log4Shell/RCE Verification String", collection: "syslog_ingest", timestamp: "2026-05-13 18:11:15", severity: "Critical" },
  { id: "INV-2026-0853", score: 83, type: "NoSQL JavaScript Injection Regex Target", collection: "product_catalog", timestamp: "2026-05-13 18:24:50", severity: "High" },
  { id: "INV-2026-0854", score: 91, type: "XML External Entity Execution (XXE)", collection: "b2b_invoices", timestamp: "2026-05-13 18:40:02", severity: "High" },
  { id: "INV-2026-0855", score: 72, type: "Race Condition Ledger Tampering", collection: "wallet_balances", timestamp: "2026-05-13 18:55:19", severity: "Medium" },
  { id: "INV-2026-0856", score: 88, type: "Deserialization Gadget Chain Attack", collection: "session_cache", timestamp: "2026-05-13 19:10:44", severity: "High" },
  { id: "INV-2026-0857", score: 95, type: "CORS Misconfiguration Abuse", collection: "internal_analytics", timestamp: "2026-05-13 19:22:10", severity: "Critical" },
  { id: "INV-2026-0858", score: 81, type: "Open Redirect Verification Loop", collection: "sso_router", timestamp: "2026-05-13 19:35:12", severity: "High" },
  { id: "INV-2026-0859", score: 97, type: "Prototype Pollution Input Mutation", collection: "fleet_telemetry", timestamp: "2026-05-13 19:50:00", severity: "Critical" },
  { id: "INV-2026-0860", score: 90, type: "SSTI (Server Side Template Injection)", collection: "notification_templates", timestamp: "2026-05-13 20:05:44", severity: "High" },
  { id: "INV-2026-0861", score: 76, type: "LDAP Filter Logic Bypass", collection: "active_directory_mirror", timestamp: "2026-05-13 20:18:22", severity: "Medium" },
  { id: "INV-2026-0862", score: 93, type: "API Rate Limit Exhaustion Flooding", collection: "sms_otp_gateway", timestamp: "2026-05-13 20:31:05", severity: "High" },
  { id: "INV-2026-0863", score: 86, type: "Insecure Deserialization (Python Pickle)", collection: "job_queue_store", timestamp: "2026-05-13 20:45:19", severity: "High" }
];

const ViewerDashboard = () => {
  // Realtime structural performance metric metrics map
  const healthData = [
    { time: '15:00', cpu: 42, mem: 58 },
    { time: '16:00', cpu: 68, mem: 61 },
    { time: '17:00', cpu: 52, mem: 64 },
    { time: '18:00', cpu: 89, mem: 72 },
    { time: '19:00', cpu: 74, mem: 79 },
    { time: '20:00', cpu: 91, mem: 85 },
  ];

  // Dynamic derivation of exact metrics from the dataset array
  const totalThreatsCount = CORE_INCIDENT_DATABASE.length;
  const criticalCount = CORE_INCIDENT_DATABASE.filter(item => item.severity === 'Critical').length;
  const highCount = CORE_INCIDENT_DATABASE.filter(item => item.severity === 'High').length;
  const mediumCount = CORE_INCIDENT_DATABASE.filter(item => item.severity === 'Medium').length;
  const lowCount = CORE_INCIDENT_DATABASE.filter(item => item.severity === 'Low').length;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto text-slate-100 bg-slate-950 min-h-screen selection:bg-indigo-500/30">
      
      {/* Viewer Mode Banner Element */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Eye className="text-amber-500 shrink-0" size={20} />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
            Viewer Mode Security Status: Read-Only Telemetry Access
          </span>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-900">
          <Lock size={12} className="text-slate-500" />
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider font-mono">Administrative Mutation Functions Disabled</span>
        </div>
      </div>

      {/* KPI Numerical Metrics Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'System Gateway Health', value: '98.42%', icon: ShieldCheck, color: 'text-emerald-400', subtext: 'Inbound filter pipeline active' },
          { label: 'Active Pipeline Feeds', value: '3,842 / sec', icon: Activity, color: 'text-cyan-400', subtext: 'Kafka edge broker load' },
          { label: 'Identified Forensic Threats', value: totalThreatsCount.toString(), icon: AlertTriangle, color: 'text-rose-400', subtext: 'Total anomalies in cache data' },
          { label: 'Distributed Clusters Status', value: '6 Nodes Ok', icon: Database, color: 'text-indigo-400', subtext: 'Replication factor matching' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{stat.label}</p>
                <h3 className="text-3xl font-black text-white tracking-tight font-mono">{stat.value}</h3>
                <p className="text-[9px] text-slate-500 font-mono pt-1">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-950 border border-slate-900/60 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Visualization Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cluster Performance Timeline Mapping Chart */}
        <div className="lg:col-span-8 p-6 bg-slate-900/20 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-mono">
              <Server size={16} className="text-indigo-400" /> SIEM Network Load Timeline
            </h3>
            <div className="flex gap-4 bg-slate-950/60 p-2 rounded-xl border border-slate-900/80 font-mono text-[9px] font-bold">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-slate-400 uppercase">CPU Utilization (%)</span>
              </div>
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-slate-400 uppercase">Memory Allocation (%)</span>
              </div>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} className="font-mono" />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} className="font-mono" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  labelStyle={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#6366f1" fillOpacity={1} fill="url(#dashboardCpu)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="mem" stroke="#22d3ee" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Threat Matrix Real-world Distribution Sidebar */}
        <div className="lg:col-span-4 p-6 bg-slate-900/20 border border-slate-800 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 font-mono">
              <ShieldAlert size={16} className="text-rose-400" /> Incident Distribution Matrix
            </h3>
            
            <div className="space-y-5">
              {[
                { type: 'Critical Structural Faults', count: criticalCount, color: 'bg-rose-500', pct: `${(criticalCount / totalThreatsCount) * 100}%` },
                { type: 'High Severity Exploits', count: highCount, color: 'bg-orange-500', pct: `${(highCount / totalThreatsCount) * 100}%` },
                { type: 'Medium Logic Mutations', count: mediumCount, color: 'bg-amber-500', pct: `${(mediumCount / totalThreatsCount) * 100}%` },
                { type: 'Low Risk Indicators', count: lowCount, color: 'bg-emerald-500', pct: `${(lowCount / totalThreatsCount) * 100}%` },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold font-mono">
                    <span className="text-slate-400 uppercase tracking-tight">{item.type}</span>
                    <span className="text-white px-1.5 py-0.5 bg-slate-950 border border-slate-900 rounded">{item.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: item.pct }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${item.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Feed Metadata Information Field */}
          <div className="mt-6 pt-4 border-t border-slate-900 text-slate-500 text-[10px] font-mono space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-slate-600" />
              <span>Data Sync Sync Cycle: Realtime Data Frame</span>
            </div>
            <p className="text-[9px] leading-relaxed text-slate-600">
              Metrics calculated via dynamic telemetry aggregation processing arrays across 22 concurrent live-monitored log streams.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ViewerDashboard;