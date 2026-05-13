import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart, 
  PieChart as PieIcon, 
  Clock, 
  CheckCircle2, 
  FileSearch,
  Mail,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart as ReBar, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import useRBAC from '../../hooks/useRBAC';

const Reports = () => {
  const { can } = useRBAC();
  const canGenerateReports = can('generate_reports');
  const [isGenerating, setIsGenerating] = useState(false);

  const incidentData = [
    { name: 'Auth Failure', value: 400, color: '#6366f1' },
    { name: 'SQL Injection', value: 300, color: '#f43f5e' },
    { name: 'Brute Force', value: 300, color: '#f59e0b' },
    { name: 'DDoS', value: 200, color: '#10b981' },
  ];

  const reportHistory = [
    { id: "REP-2026-05", name: "Monthly Security Audit", date: "May 01, 2026", size: "4.2 MB", status: "Ready" },
    { id: "REP-2026-04", name: "Q1 Compliance Review", date: "Apr 01, 2026", size: "12.8 MB", status: "Ready" },
    { id: "REP-2026-03", name: "Infrastructure Load Analysis", date: "Mar 15, 2026", size: "2.1 MB", status: "Archived" },
  ];

  const handleGenerate = () => {
    if (!canGenerateReports) return;
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2500);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChart className="text-indigo-500" size={32} /> Intelligence Reports
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">
            Analytical Insight & Compliance Documentation
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!canGenerateReports}
            title={canGenerateReports ? 'Schedule report emails' : 'Permission required: generate_reports'}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all ${
              canGenerateReports
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-700 cursor-not-allowed'
            }`}
          >
            <Mail size={14} /> Schedule Automated Email
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Report Configuration Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <section className="card p-6 bg-slate-900/40 border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <FileSearch size={16} className="text-indigo-400" /> Generate New Report
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Report Type</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-all">
                  <option>Security Incident Summary</option>
                  <option>User Activity Audit</option>
                  <option>Infrastructure Health Log</option>
                  <option>Compliance (SOC2/GDPR)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:border-indigo-500 transition-all">Last 30 Days</button>
                  <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:border-indigo-500 transition-all">Last Quarter</button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !canGenerateReports}
                  title={canGenerateReports ? 'Generate report' : 'Permission required: generate_reports'}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                    isGenerating
                      ? 'bg-slate-800 text-slate-500'
                      : canGenerateReports
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? <Clock className="animate-spin" size={14} /> : <Download size={14} />}
                  {isGenerating ? 'Compiling Data...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </section>

          {/* Quick Metrics */}
          <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-3xl">
             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Storage Savings</h4>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white italic">42%</span>
                <span className="text-[10px] text-slate-500 font-bold mb-1 uppercase">via log compression</span>
             </div>
          </div>
        </div>

        {/* Data Visualization & Archives */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual 01: Incident Distribution */}
            <div className="card p-6 bg-slate-900/20 border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <PieIcon size={14} className="text-indigo-400" /> Incident Categorization
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incidentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {incidentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 02: Archive History */}
            <div className="card p-6 bg-slate-900/20 border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={14} className="text-indigo-400" /> Generated Archives
              </h3>
              <div className="space-y-4">
                {reportHistory.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg text-slate-500 group-hover:text-indigo-400">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white leading-none">{report.name}</p>
                        <p className="text-[9px] text-slate-600 mt-1 uppercase">{report.id} • {report.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canGenerateReports}
                      title={canGenerateReports ? 'Download archive' : 'Permission required: generate_reports'}
                      className={`p-2 ${canGenerateReports ? 'text-slate-500 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance Checklist Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute right-0 top-0 p-8 opacity-5">
                <BarChart size={120} className="text-indigo-500" />
             </div>
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-sm font-black text-white uppercase tracking-widest italic underline decoration-indigo-500 underline-offset-8">Compliance Status</h3>
               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full border border-emerald-500/20">AUDIT PASS</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Data Retention Policy", status: "Compliant" },
                  { label: "Encryption at Rest (AES-256)", status: "Verified" },
                  { label: "User Access Control (RBAC)", status: "Compliant" },
                  { label: "Network Segmentation", status: "Verified" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-indigo-500" />
                    <span className="text-[11px] text-slate-400 font-bold uppercase">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Reports;