import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Bell, 
  Shield, 
  Key, 
  Database, 
  Webhook, 
  Save, 
  RefreshCcw,
  Cpu,
  Lock,
  Mail
} from 'lucide-react';
import useRBAC from '../../hooks/useRBAC';

const Settings = () => {
  const { can } = useRBAC();
  const canManageSettings = can('manage_settings');
  const [activeTab, setActiveTab] = useState('General');

  const tabs = [
    { id: 'General', icon: Globe },
    { id: 'Security', icon: Shield },
    { id: 'API & Webhooks', icon: Key },
    { id: 'Storage', icon: Database },
    { id: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-indigo-500" size={32} /> System Configuration
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">
            Last modified: May 13, 2026 • Admin: Nakka Srijith
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!canManageSettings}
            title={canManageSettings ? 'Save configuration changes' : 'Permission required: manage_settings'}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              canManageSettings
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8 bg-slate-900/40 border-slate-800 space-y-10"
          >
            {/* Conditional Content: Security Tab Example */}
            {activeTab === 'Security' && (
              <>
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Lock size={18} className="text-indigo-400" /> Authentication Policies
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">Enforce MFA</span>
                        <div className="w-10 h-5 bg-indigo-600 rounded-full relative"><div className="absolute top-1 left-6 w-3 h-3 bg-white rounded-full" /></div>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase leading-relaxed">Require Multi-Factor Authentication for all Admin roles.</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">Session Timeout</span>
                        <select className="bg-slate-900 text-[10px] text-indigo-400 font-bold outline-none border-none">
                          <option>15 Minutes</option>
                          <option>1 Hour</option>
                          <option>8 Hours</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase leading-relaxed">Automatic log-out duration for inactive sessions.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Key size={18} className="text-indigo-400" /> API Access Keys
                  </h3>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div className="font-mono text-[11px] text-slate-400">
                      sk_live_••••••••••••••••4x92
                    </div>
                    <button
                      type="button"
                      disabled={!canManageSettings}
                      title={canManageSettings ? 'Rotate API key' : 'Permission required: manage_settings'}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        canManageSettings
                          ? 'text-indigo-400 hover:text-white'
                          : 'text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <RefreshCcw size={14} /> Rotate Key
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* Conditional Content: Storage Tab Example */}
            {activeTab === 'Storage' && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Database size={18} className="text-indigo-400" /> Log Retention Engine
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-300">Hot Storage (MongoDB)</span>
                      <span className="text-indigo-400">30 Days</span>
                    </div>
                    <input type="range" className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-300">Cold Storage (Archive)</span>
                      <span className="text-indigo-400">365 Days</span>
                    </div>
                    <input type="range" className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500" />
                  </div>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-start gap-4">
                  <Cpu size={24} className="text-indigo-400 mt-1" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Auto-Purge Strategy</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase leading-relaxed font-bold">
                      The system is configured to move logs older than 30 days to the <span className="text-indigo-400">Deep-Archive Cluster</span> to optimize query performance.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* General Tab Placeholder */}
            {activeTab === 'General' && (
              <section className="space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">General Environment</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">System Display Name</label>
                    <input type="text" placeholder="Sentinel SIEM Enterprise" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Primary Contact Email</label>
                    <input type="email" placeholder="admin@siem.io" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;