import React, { useState } from 'react';
import { 
  Bell, 
  Lock, 
  Monitor, 
  Cpu, 
  Database, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    toast.success("Configuration synced to local storage", {
      style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' }
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1000px] mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Control Panel</h1>
          <p className="text-slate-500 text-sm">Configure system ingestion and alert parameters.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/20"
        >
          <Save size={16} /> Save Changes
        </button>
      </header>

      <div className="space-y-6">
        {/* Notification Settings */}
        <section className="card p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Bell size={18} className="text-amber-400" /> Alert Thresholds
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <div>
                <p className="text-sm text-slate-200">Critical Severity Push</p>
                <p className="text-[10px] text-slate-500">Enable real-time toasts for risk scores &gt; 80%</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <div>
                <p className="text-sm text-slate-200">Kafka Stream Heartbeat</p>
                <p className="text-[10px] text-slate-500">Alert if stream latency exceeds 500ms</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-indigo-500" />
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section className="card p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Lock size={18} className="text-rose-500" /> API & Keys
          </h3>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-black">Sentinel Public Key</label>
            <div className="flex gap-2">
              <input 
                type={showKey ? "text" : "password"} 
                readOnly 
                value="sk_sentinel_live_92834729384"
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-indigo-300 w-full focus:outline-none"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </section>

        {/* System Settings */}
        <section className="card p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Cpu size={18} className="text-cyan-400" /> Ingestion Engine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-black">Buffer Limit</label>
              <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white w-full">
                <option>50 Records</option>
                <option selected>100 Records</option>
                <option>500 Records</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-black">Auto-Refresh Rate</label>
              <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white w-full">
                <option>Real-time (Socket)</option>
                <option>5 Seconds</option>
                <option>30 Seconds</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;