import React, { useEffect, useMemo, useState } from 'react';
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
import { aiAPI } from '../../services/api';

const AIControls = () => {
  const { can } = useRBAC();
  const canManageAI = can('manage_ai_settings');
  const [sensitivity, setSensitivity] = useState(72);
  const [controls, setControls] = useState({
    deepPacketInspection: true,
    anomalyAutoCluster: true,
    selfHealingRules: false,
    predictiveAnalytics: true
  });
  const [modelName, setModelName] = useState('Sentinel-NLP-v4');
  const [modelStatus, setModelStatus] = useState('active');
  const [modelVersion, setModelVersion] = useState('v4.0.0');
  const [summary, setSummary] = useState({ logsAnalyzed: 0, anomaliesObserved: 0, lastEvaluationAt: null });
  const [retraining, setRetraining] = useState({ retrainCount: 0, lastReason: '', lastDurationMs: 0, lastCompletedAt: null });
  const DEFAULT_METRICS = [
    { subject: 'Precision', A: 0, fullMark: 150 },
    { subject: 'Recall', A: 0, fullMark: 150 },
    { subject: 'Latency', A: 0, fullMark: 150 },
    { subject: 'F1 Score', A: 0, fullMark: 150 },
    { subject: 'Accuracy', A: 0, fullMark: 150 }
  ];

  const safeMetrics = (arr) => (Array.isArray(arr) && arr.length ? arr : DEFAULT_METRICS);

  const [modelMetrics, setModelMetrics] = useState(DEFAULT_METRICS);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await aiAPI.getDashboard();
      const data = response.data?.data || response.data || {};
      const state = data.state || {};

      setSensitivity(state.sensitivity ?? 72);
      setControls(state.controls || {
        deepPacketInspection: true,
        anomalyAutoCluster: true,
        selfHealingRules: false,
        predictiveAnalytics: true
      });
      setModelName(state.modelName || 'Sentinel-NLP-v4');
      setModelVersion(state.modelVersion || 'v4.0.0');
      setModelStatus(state.status || 'active');
      setSummary(state.summary || { logsAnalyzed: 0, anomaliesObserved: 0, lastEvaluationAt: null });
      setRetraining(state.retraining || { retrainCount: 0, lastReason: '', lastDurationMs: 0, lastCompletedAt: null });
      setModelMetrics(safeMetrics(data.metrics));
      setActivity(data.activity || []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load AI controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const statusLabel = useMemo(() => {
    if (modelStatus === 'training') return 'Training';
    if (modelStatus === 'paused') return 'Paused';
    if (modelStatus === 'error') return 'Error';
    return 'Active';
  }, [modelStatus]);

  const refreshBadge = useMemo(() => (loading ? 'Loading...' : 'Live from backend'), [loading]);

  const handleRetrain = async () => {
    if (!canManageAI) return;
    try {
      setIsRetraining(true);
      const response = await aiAPI.retrain({ reason: 'Manual retraining from AI controls panel' });
      const data = response.data?.data || response.data || {};
      const state = data.state || {};
      setSensitivity(state.sensitivity ?? sensitivity);
      setControls(state.controls || controls);
      setModelName(state.modelName || modelName);
      setModelStatus(state.status || 'active');
      setModelMetrics(safeMetrics(data.metrics));
      setActivity(data.activity || activity);
    } catch (retrainError) {
      setError(retrainError.response?.data?.message || 'Retraining failed');
    } finally {
      setIsRetraining(false);
    }
  };

  const handleSave = async () => {
    if (!canManageAI) return;
    try {
      setIsSaving(true);
      const response = await aiAPI.updateSettings({
        sensitivity: Number(sensitivity),
        controls,
        modelName,
      });
      const data = response.data?.data || response.data || {};
      const state = data.state || {};
      setSensitivity(state.sensitivity ?? sensitivity);
      setControls(state.controls || controls);
      setModelName(state.modelName || modelName);
      setModelStatus(state.status || 'active');
      setModelMetrics(safeMetrics(data.metrics));
      setActivity(data.activity || activity);
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Failed to save AI controls');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    await loadDashboard();
  };

  const toggleControl = (key) => {
    if (!canManageAI) return;
    setControls((current) => ({ ...current, [key]: !current[key] }));
  };

  const liveActivity = activity.length > 0 ? activity : [
    { timestamp: '16:25:01', code: 'INFER_BLOCK_START', status: 'SUCCESS', message: 'Inference block started successfully' },
    { timestamp: '16:25:04', code: 'FEATURE_EXTRACT:mdb_v4', status: 'SUCCESS', message: 'Feature extraction completed' },
    { timestamp: '16:25:08', code: 'ANOMALY_CONFIDENCE_LOW', status: 'SKIPPED', message: 'Low confidence anomaly skipped' },
    { timestamp: '16:25:12', code: 'VECTOR_UPDATE_COMMIT', status: 'SUCCESS', message: 'Vector update committed successfully' }
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Brain className="text-indigo-500" size={32} /> AI Intelligence Core
          </h1>
          <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-widest">
            Model: {modelName} • Version: {modelVersion} • Status: {statusLabel}
          </p>
          <p className="text-slate-600 text-[10px] mt-1 uppercase tracking-[0.3em]">{refreshBadge}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 disabled:opacity-60"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
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
        </div>
      </motion.header>

      {error ? (
        <div className="rounded-xl border border-rose-800 bg-rose-950/60 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Logs Analyzed', value: summary.logsAnalyzed || 0, icon: Cpu },
            { label: 'Anomalies Seen', value: summary.anomaliesObserved || 0, icon: AlertCircle },
            { label: 'Retrain Count', value: retraining.retrainCount || 0, icon: Play },
            { label: 'Last Duration', value: retraining.lastDurationMs ? `${retraining.lastDurationMs} ms` : 'n/a', icon: BarChart3 }
          ].map((item) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-5 bg-slate-900/40 border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
                </div>
                <item.icon className="text-indigo-400" size={18} />
              </div>
            </motion.div>
          ))}
        </div>
        
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
                onChange={(e) => setSensitivity(Number(e.target.value))}
                disabled={!canManageAI}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Model Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'deepPacketInspection', label: 'Deep Packet Inspection', desc: 'Enable NLP-based payload analysis' },
                { key: 'anomalyAutoCluster', label: 'Anomaly Auto-Cluster', desc: 'Group similar threats automatically' },
                { key: 'selfHealingRules', label: 'Self-Healing Rules', desc: 'Generate firewall rules dynamically' },
                { key: 'predictiveAnalytics', label: 'Predictive Analytics', desc: 'Forecast threat vectors for next 24h' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleControl(item.key)}
                  disabled={!canManageAI}
                  className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 text-left disabled:cursor-not-allowed"
                >
                  <div className="max-w-[80%]">
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-500 uppercase leading-tight mt-1">{item.desc}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${controls[item.key] ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${controls[item.key] ? 'left-6' : 'left-1'}`} />
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[10px] uppercase tracking-widest text-slate-500">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-black text-slate-400">Last Model Eval</p>
                <p className="mt-2 text-slate-300">{summary.lastEvaluationAt ? new Date(summary.lastEvaluationAt).toLocaleString() : 'Not evaluated yet'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-black text-slate-400">Last Retrain</p>
                <p className="mt-2 text-slate-300">{retraining.lastCompletedAt ? new Date(retraining.lastCompletedAt).toLocaleString() : 'Never'}</p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canManageAI || isSaving}
                title={canManageAI ? 'Apply AI configuration' : 'Permission required: manage_ai_settings'}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  canManageAI ? 'text-indigo-400 hover:text-white' : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Apply Global AI Config'}
              </button>
              <span className="text-[10px] uppercase tracking-widest text-slate-600">{canManageAI ? 'Backend connected' : 'Read-only mode'}</span>
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
                  <PolarRadiusAxis angle={90} domain={[0, 150]} tick={false} stroke="#1e293b" />
                  <Radar
                    name={modelName}
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
             <div className="space-y-3 font-mono text-[10px] max-h-[190px] overflow-auto pr-1">
                {liveActivity.map((item, index) => (
                  <div key={`${item.code}-${index}`} className="flex justify-between gap-4 text-slate-400">
                    <span>[{item.timestamp}] {item.code}</span>
                    <span className={item.status === 'SKIPPED' ? 'text-rose-400' : 'text-indigo-400'}>
                      {item.status === 'SUCCESS' && item.durationMs ? `${item.durationMs}ms` : item.status}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIControls;