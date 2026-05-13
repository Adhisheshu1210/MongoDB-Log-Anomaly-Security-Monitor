import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Zap, 
  Target, 
  Activity, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  ExternalLink,
  BrainCircuit,
  Binary,
  ToggleLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import toast from 'react-hot-toast';
import { anomaliesAPI, siemDatasetAPI } from '../../services/api';
import useRBAC from '../../hooks/useRBAC';

const Anomalies = () => {
  const { can } = useRBAC();
  const [anomalies, setAnomalies] = useState([]);
  const [siemAnomalies, setSiemAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showSiemData, setShowSiemData] = useState(false);
  const [displayedAnomalies, setDisplayedAnomalies] = useState([]);

  const fetchAnomalies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await anomaliesAPI.getAnomalies();
      setAnomalies(res.data);
    } catch (err) {
      toast.error("Failed to sync AI detection engine");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSiemAnomalies = useCallback(async () => {
    try {
      const res = await siemDatasetAPI.getAll({ limit: 100 });
      const siemAnomalyRecords = (res.data?.data || [])
        .filter(record => record.isAnomaly)
        .map((record, idx) => ({
          _id: record.id,
          type: record.classification || 'unknown',
          anomalyScore: record.anomalyScore || 0,
          severity: record.severity || 'UNKNOWN',
          timestamp: record.timestamp,
          source: record.source,
          riskScore: (record.anomalyScore || 0) * 100,
          confidence: Math.min((record.anomalyScore || 0) + 0.2, 1),
          metadata: record.record
        }));
      setSiemAnomalies(siemAnomalyRecords);
    } catch (err) {
      // Silently fail for SIEM data
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
    fetchSiemAnomalies();
  }, [fetchAnomalies, fetchSiemAnomalies]);

  useEffect(() => {
    const allAnomalies = showSiemData ? [...anomalies, ...siemAnomalies] : anomalies;
    setDisplayedAnomalies(allAnomalies);
  }, [anomalies, siemAnomalies, showSiemData]);

  // Risk Level Styling
  const getRiskStatus = (score) => {
    if (score >= 80) return { label: 'CRITICAL', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
    if (score >= 50) return { label: 'ELEVATED', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { label: 'LOW', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ML Inference Engine</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Anomaly Detection</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSiemData(!showSiemData)}
            className={`p-3 rounded-xl transition-all ${
              showSiemData ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
            title="Toggle SIEM dataset anomalies"
          >
            <ToggleLeft size={20} />
          </button>
          <button onClick={fetchAnomalies} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-indigo-400 hover:text-white transition-all shadow-xl">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Avg Risk Score', val: (displayedAnomalies.length > 0 ? (displayedAnomalies.reduce((sum, a) => sum + (Number(a.riskScore ?? ((a.anomalyScore || 0) * 100))), 0) / displayedAnomalies.length).toFixed(1) : '0'), icon: Target, color: 'text-rose-400', pulse: 'bg-rose-400' },
          { label: 'Model Confidence', val: '94.2%', icon: Zap, color: 'text-cyan-400', pulse: 'bg-cyan-400' },
          { label: 'Total Anomalies', val: displayedAnomalies.length.toString(), icon: Binary, color: 'text-purple-400', pulse: 'bg-purple-400' },
        ].map((m, i) => (
          <div key={i} className="card p-6 relative overflow-hidden group">
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${m.pulse} opacity-[0.03] group-hover:opacity-10 blur-2xl transition-opacity`} />
            <m.icon className={`${m.color} mb-4`} size={24} />
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{m.label}</p>
            <h2 className="text-3xl font-bold text-white mt-1">{m.val}</h2>
          </div>
        ))}
      </div>

      {/* Distribution Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Cluster Distribution
          </h3>
          <span className="text-[10px] font-mono text-slate-500">{showSiemData ? 'K-MEANS (CORE + SIEM)' : 'K-MEANS INFOSYS V3.2'}</span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <XAxis type="number" dataKey="x" name="Time" hide />
              <YAxis type="number" dataKey="y" name="Frequency" hide />
              <ZAxis type="number" dataKey="z" range={[50, 400]} name="Severity" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
              />
              <Scatter
                name="Anomalies"
                data={displayedAnomalies.map((a, i) => {
                  const score = Number(a.riskScore ?? ((a.anomalyScore || 0) * 100));
                  return { x: i, y: score, z: Math.max(score, 1) };
                })}
              >
                {displayedAnomalies.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={Number(entry.riskScore ?? ((entry.anomalyScore || 0) * 100)) > 70 ? '#ff3366' : '#9933ff'} 
                    className="animate-pulse"
                    style={{
                      filter: `drop-shadow(0 0 8px ${Number(entry.riskScore ?? ((entry.anomalyScore || 0) * 100)) > 70 ? '#ff3366' : '#9933ff'})`
                    }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card overflow-hidden">
        <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{showSiemData ? 'All Anomalies (CORE + SIEM)' : 'Recent Detections'}</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Filter ID..." className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-[10px] text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/30 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Pattern Type</th>
                <th className="p-4">Risk Level</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Source</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <AnimatePresence>
                {displayedAnomalies.slice(0, 50).map((anomaly) => {
                  const riskScore = Number(anomaly.riskScore ?? ((anomaly.anomalyScore || 0) * 100));
                  const status = getRiskStatus(riskScore);
                  return (
                    <motion.tr 
                      key={anomaly._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-all cursor-pointer group"
                      onClick={() => setSelectedAnomaly(anomaly)}
                    >
                      <td className="p-4 font-mono text-xs text-indigo-400">{anomaly._id.slice(-8).toUpperCase()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-white font-medium">{anomaly.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black border ${status.bg} ${status.color} ${status.border}`}>
                          {status.label} {Math.round(riskScore)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ width: `${(anomaly.confidence || 0) * 100}%` }} />
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {anomaly.source || 'core'}
                      </td>
                      <td className="p-4 text-right">
                        {can('resolve_alerts') && (
                          <button className="p-2 text-slate-500 hover:text-white transition-colors">
                            <ExternalLink size={16} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Anomalies;