import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Settings, 
  RefreshCcw, 
  Zap, 
  Brain, 
  AlertCircle, 
  BarChart3, 
  Activity,
  Play,
  Save,
  SlidersHorizontal
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import useRBAC from '../../hooks/useRBAC';

const AIControls = () => {
  const { can } = useRBAC();
  const canManageAI = can('manage_ai_settings');
  const [sensitivity, setSensitivity] = useState(72);
  const [isRetraining, setIsRetraining] = useState(false);

  const modelMetrics = [
    { subject: 'Precision', A: 120, fullMark: 150 },
    { subject: 'Recall', A: 98, fullMark: 150 },
    { subject: 'Latency', A: 86, fullMark: 150 },
    { subject: 'F1 Score', A: 99, fullMark: 150 },
    { subject: 'Accuracy', A: 85, fullMark: 150 },
  ];

  const handleRetrain = () => {
    if (!canManageAI) return;
    setIsRetraining(true);
    setTimeout(() => setIsRetraining(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Brain className="text-indigo-500" size={32} /> AI Intelligence Core
          </h1>
          <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-widest">
            Model: Sentinel-NLP-v4 • Status: Active
          </p>
        </div>
        <button 
          type="button"
          onClick={handleRetrain}
          disabled={isRetraining || !canManageAI}
          title={canManageAI ? 'Retrain AI model' : 'Permission required: manage_ai_settings'}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-lg ${
            isRetraining
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : canManageAI
                ? 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-500'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <RefreshCcw size={16} className={isRetraining ? 'animate-spin' : ''} />
          {isRetraining ? 'Retraining...' : 'Initiate Retraining'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Model Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <section className="card p-6 bg-slate-900/40 border-slate-800 space-y-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-indigo-400" /> Hyperparameter Tuning
            </h3>
            
            {/* Sensitivity Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <label className="text-xs font-bold text-slate-300">Detection Sensitivity</label>
                  <p className="text-[10px] text-slate-500 uppercase">Higher values may increase false positives</p>
                </div>
                <span className="text-2xl font-black text-indigo-400 font-mono">{sensitivity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={sensitivity} 
                onChange={(e) => setSensitivity(e.target.value)}
                disabled={!canManageAI}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Model Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Deep Packet Inspection", desc: "Enable NLP-based payload analysis", active: true },
                { label: "Anomaly Auto-Cluster", desc: "Group similar threats automatically", active: true },
                { label: "Self-Healing Rules", desc: "Generate firewall rules dynamically", active: false },
                { label: "Predictive Analytics", desc: "Forecast threat vectors for next 24h", active: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="max-w-[80%]">
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-500 uppercase leading-tight mt-1">{item.desc}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${item.active ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.active ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                type="button"
                disabled={!canManageAI}
                title={canManageAI ? 'Apply AI configuration' : 'Permission required: manage_ai_settings'}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  canManageAI ? 'text-indigo-400 hover:text-white' : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <Save size={14} /> Apply Global AI Config
              </button>
            </div>
          </section>
        </div>

        {/* Model Metrics & Training Data */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Radar Chart for Performance */}
          <div className="card p-6 bg-slate-900/40 border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Model Performance Matrix</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={modelMetrics}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar
                    name="Sentinel-v4"
                    dataKey="A"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Activity Ticker */}
          <div className="card p-6 bg-slate-950 border border-slate-800">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inference Logs</h3>
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             </div>
             <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>[16:25:01] INFER_BLOCK_START</span>
                  <span className="text-indigo-400">SUCCESS</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>[16:25:04] FEATURE_EXTRACT:mdb_v4</span>
                  <span className="text-indigo-400">0.04ms</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>[16:25:08] ANOMALY_CONFIDENCE_LOW</span>
                  <span>SKIPPED</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>[16:25:12] VECTOR_UPDATE_COMMIT</span>
                  <span className="text-indigo-400">OK</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIControls;