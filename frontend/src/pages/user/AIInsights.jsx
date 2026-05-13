import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  TrendingUp, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Lock, 
  ArrowUpRight,
  Fingerprint,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

const AIInsights = () => {
  // Mock Data for the Radar Chart (Model Performance)
  const modelData = [
    { subject: 'Accuracy', A: 98, fullMark: 100 },
    { subject: 'Recall', A: 92, fullMark: 100 },
    { subject: 'Precision', A: 95, fullMark: 100 },
    { subject: 'Latency', A: 85, fullMark: 100 },
    { subject: 'Detection', A: 90, fullMark: 100 },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Predictive Intelligence Active</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight text-glow">AI Insights</h1>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button className="px-4 py-2 text-[10px] font-bold text-white bg-indigo-600 rounded-lg">LAST 24H</button>
          <button className="px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300">WEEKLY</button>
        </div>
      </div>

      {/* Hero Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Threat Level Forecast */}
        <div className="lg:col-span-2 card p-8 bg-gradient-to-br from-slate-900/80 to-slate-950">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <TrendingUp className="text-indigo-400" /> Security Posture Forecast
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">STABLE</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { t: '10:00', v: 20 }, { t: '12:00', v: 25 }, { t: '14:00', v: 60 }, 
                { t: '16:00', v: 45 }, { t: '18:00', v: 30 }, { t: '20:00', v: 35 }
              ]}>
                <XAxis dataKey="t" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={4} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-xs text-slate-400 leading-relaxed">
            AI predicts a 15% increase in brute-force attempts over the next 4 hours based on regional node activity in <span className="text-white font-bold underline decoration-indigo-500">AP-SOUTH-1</span>.
          </p>
        </div>

        {/* Model Efficacy Radar */}
        <div className="card p-8 flex flex-col items-center justify-center">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Model Metrics</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={modelData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                <Radar name="Sentinel-V2" dataKey="A" stroke="#00aaff" fill="#00aaff" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 text-center">
            <div className="text-2xl font-black text-white">96.4%</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Average Confidence</div>
          </div>
        </div>
      </div>

      {/* Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Top Risk Factor */}
        <div className="card p-6 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><AlertCircle size={20} /></div>
            <h4 className="text-sm font-bold text-white">Top Risk: PII Leakage</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">Unencrypted email fields detected in <code className="text-rose-400">auth_logs</code>. AI suggests immediate field hashing.</p>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-600">IMPACT: HIGH</span>
            <span className="text-rose-500 font-bold">REMEDIATE NOW</span>
          </div>
        </div>

        {/* Behavioral Insight */}
        <div className="card p-6 border-l-4 border-l-cyan-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Fingerprint size={20} /></div>
            <h4 className="text-sm font-bold text-white">User Behavior Analysis</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">98% of anomalies originate from 3 specific IP ranges. Pattern suggests a coordinated botnet scrape.</p>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-600">TYPE: COORDINATED</span>
            <span className="text-cyan-400 font-bold">BLOCK SUBNET</span>
          </div>
        </div>

        {/* System Optimization */}
        <div className="card p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><BarChart3 size={20} /></div>
            <h4 className="text-sm font-bold text-white">Indexing Recommendation</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">Slow query detected in <code className="text-emerald-400">audit_trail</code>. AI suggests a compound index on <code className="text-white">timestamp_1_user_1</code>.</p>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-600">SAVINGS: 420ms</span>
            <span className="text-emerald-400 font-bold">APPLY INDEX</span>
          </div>
        </div>

      </div>

      {/* Global Intelligence Map Placeholder */}
      <div className="card p-8 bg-slate-900/30 overflow-hidden relative">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="text-indigo-400 animate-spin-slow" size={20} />
          <h3 className="text-lg font-bold text-white">Active Threat Geo-Correlation</h3>
        </div>
        <div className="h-[200px] flex items-center justify-center border border-slate-800 rounded-xl bg-slate-950/50 relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
           <div className="text-slate-700 font-mono text-[10px] animate-pulse">GENERATING GLOBAL THREAT MAP...</div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;