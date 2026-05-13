import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Globe, 
  Eye, 
  FileWarning, 
  Zap, 
  Key, 
  AlertOctagon,
  Fingerprint,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import useRBAC from '../../hooks/useRBAC';

const SecurityCenter = () => {
  const { can } = useRBAC();
  const canManageSecurity = can('manage_security');

  const attackSurfaceData = [
    { name: '00:00', attempts: 120 }, { name: '04:00', attempts: 300 },
    { name: '08:00', attempts: 150 }, { name: '12:00', attempts: 800 },
    { name: '16:00', attempts: 450 }, { name: '20:00', attempts: 210 }
  ];

  const securityPolicies = [
    { title: "Multi-Factor Auth (MFA)", status: "ENFORCED", desc: "Required for all admin-level actions.", active: true },
    { title: "IP Rate Limiting", status: "ACTIVE", desc: "Max 100 requests/sec per origin IP.", active: true },
    { title: "Cold Storage Encryption", status: "ENFORCED", desc: "AES-256 for logs older than 30 days.", active: true },
    { title: "Automated IP Blacklisting", status: "LEARNING", desc: "AI-driven blocking of suspicious nodes.", active: false },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Strategic Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
            <ShieldCheck size={14} /> Defensive Posture
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Security Center</h1>
        </div>
        
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-6">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase">Risk Level</p>
            <p className="text-lg font-black text-emerald-500">LOW</p>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase">Protection Score</p>
            <p className="text-lg font-black text-white tracking-widest">94/100</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Threat Map & Analytics - Left Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Global Threat Map Simulation */}
          <div className="relative h-[400px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              {/* This represents where a vector world map component would live */}
              <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50" />
              <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            </div>

            <div className="absolute top-6 left-6 space-y-1">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Globe size={16} className="text-indigo-400" /> Live Attack Origin Map
              </h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Inbound Traffic Vectorization</p>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div className="flex gap-4">
                <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Top Source</p>
                  <p className="text-xs font-bold text-white">Frankfurt, DE</p>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Detected Threats</p>
                  <p className="text-xs font-bold text-rose-500">2,402 Today</p>
                </div>
              </div>
              <button
                type="button"
                disabled={!canManageSecurity}
                title={canManageSecurity ? 'Open detailed threat map' : 'Permission required: manage_security'}
                className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                  canManageSecurity
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                View Detailed Map
              </button>
            </div>
          </div>

          {/* Attack Surface Graph */}
          <div className="card p-6 bg-slate-900/20 border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Unauthorized Login Attempts (24h)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attackSurfaceData}>
                  <XAxis dataKey="name" hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                  <Area type="step" dataKey="attempts" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Global Policy Panel - Right Column */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="card p-6 bg-slate-900/40 border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Lock size={16} className="text-indigo-400" /> Active Policies
            </h3>
            <div className="space-y-4">
              {securityPolicies.map((policy, i) => (
                <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 group hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-white tracking-tight">{policy.title}</h4>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded ${policy.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                      {policy.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-bold">{policy.desc}</p>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!canManageSecurity}
                      title={canManageSecurity ? 'Configure policy' : 'Permission required: manage_security'}
                      className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-opacity ${
                        canManageSecurity
                          ? 'text-indigo-400 opacity-0 group-hover:opacity-100'
                          : 'text-slate-600 cursor-not-allowed opacity-100'
                      }`}
                    >
                      Configure <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alerts Sidebar */}
          <div className="card p-6 border-rose-500/20 bg-rose-500/5 shadow-2xl shadow-rose-500/5">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-500 rounded-lg text-white">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Urgent Advisory</h3>
             </div>
             <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-1 h-auto bg-rose-500 rounded-full" />
                  <div>
                    <p className="text-xs font-bold text-white">Kernel Vulnerability Found</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">CVE-2026-0912: Patch required for Shard-04.</p>
                  </div>
                </div>
             </div>
             <button
               type="button"
               disabled={!canManageSecurity}
               title={canManageSecurity ? 'Initiate patch sequence' : 'Permission required: manage_security'}
               className={`w-full mt-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                 canManageSecurity
                   ? 'bg-rose-500 text-white hover:bg-rose-600'
                   : 'bg-slate-800 text-slate-500 cursor-not-allowed'
               }`}
             >
               Initiate Patch Sequence
             </button>
          </div>

          {/* Encryption Status Card */}
          <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl relative overflow-hidden">
             <Fingerprint className="absolute -right-4 -bottom-4 text-indigo-500 opacity-10" size={100} />
             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Crypto Engine</h4>
             <p className="text-xl font-black text-white">AES-XTS 256</p>
             <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">FIPS 140-2 Validated Ingress</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SecurityCenter;