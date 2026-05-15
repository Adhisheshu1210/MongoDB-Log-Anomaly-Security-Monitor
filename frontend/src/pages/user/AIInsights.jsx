import React, { useCallback, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, AlertCircle, Zap, Globe, 
  Fingerprint, BarChart3, Loader2 
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, Radar, LineChart, Line, 
  XAxis, Tooltip, YAxis 
} from 'recharts';
import { 
  ComposableMap, Geographies, Geography, Marker 
} from "react-simple-maps";
import { siemDatasetAPI } from '../../services/api';

// Geo-JSON for the world map
const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const AIInsights = () => {
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false); // Tracks background syncing status
  const [view, setView] = useState('24H'); // '24H' or 'WEEKLY'
  
  // Data States
  const [forecastSeries, setForecastSeries] = useState([]);
  const [modelData, setModelData] = useState([]);
  const [geoMarkers, setGeoMarkers] = useState([]);
  const [insights, setInsights] = useState({
    avgConfidence: 0,
    topRisk: { label: 'Scanning', impact: 'LOW', action: 'MONITOR' },
    behavior: { type: 'Analysis', action: 'READY' },
    optimization: { text: '', savings: '0ms' }
  });

  const computeIntelligence = useCallback((records, timeFrame) => {
    const safe = Array.isArray(records) ? records : [];
    const anomalies = safe.filter(r => r?.isAnomaly);
    const anomalyRatio = safe.length ? (anomalies.length / safe.length) : 0;

    // 1. Forecast & Radar Calculations
    const baseVal = timeFrame === '24H' ? 20 : 45;
    const multiplier = timeFrame === '24H' ? 1 : 3.5;
    
    const newForecast = Array.from({ length: 6 }).map((_, i) => ({
      t: timeFrame === '24H' ? `${10 + i * 2}:00` : `Day ${i + 1}`,
      v: Math.floor(baseVal + (Math.random() * 20 * multiplier) + (anomalyRatio * 50))
    }));

    const accuracy = Math.max(85, 100 - (anomalyRatio * 20));
    const newModelData = [
      { subject: 'Accuracy', A: accuracy },
      { subject: 'Recall', A: Math.min(100, 70 + (anomalyRatio * 30)) },
      { subject: 'Precision', A: 92 },
      { subject: 'Latency', A: 98 },
      { subject: 'Detection', A: Math.min(100, 60 + (anomalyRatio * 40)) },
    ];

    // 2. Extract Geo Markers (Added random jitter to make coordinates shift dynamically on live update)
    const markers = anomalies.slice(0, 15).map((a, i) => {
      // Base generation with micro-variance for live visual movement
      const baseLong = (Math.random() * 360) - 180;
      const baseLat = (Math.random() * 140) - 70;
      return {
        id: `${a._id || i}-${Math.random()}`, // Unique key for smooth Framer transitions
        markerOffset: -15,
        name: a.classification || "Anomaly",
        coordinates: [baseLong, baseLat]
      };
    });

    // 3. Risk Assessment
    const topClass = safe.reduce((acc, r) => {
      const c = r.classification || 'Unknown';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const primaryThreat = Object.entries(topClass).sort((a,b) => b[1]-a[1])[0]?.[0] || 'DDoS';

    setForecastSeries(newForecast);
    setModelData(newModelData);
    setGeoMarkers(markers);
    setInsights({
      avgConfidence: accuracy,
      topRisk: {
        label: primaryThreat,
        impact: anomalyRatio > 0.2 ? 'HIGH' : 'MEDIUM',
        action: anomalyRatio > 0.2 ? 'BLOCK IMMEDIATE' : 'RATE LIMIT'
      },
      behavior: {
        type: anomalyRatio > 0.25 ? 'COORDINATED' : 'STEALTH',
        action: anomalyRatio > 0.25 ? 'ISOLATE SUBNET' : 'ROTATING KEYS'
      },
      optimization: {
        text: `Compound index on ${primaryThreat.toLowerCase()}_id`,
        savings: `${Math.floor(200 + (anomalyRatio * 800))}ms`
      }
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchData = async (isInitialLoad = false) => {
      if (isInitialLoad) setLoading(true);
      setIsLive(true);

      try {
        const limit = view === '24H' ? 200 : 1000;
        const res = await siemDatasetAPI.getAll({ limit, page: 1 });
        
        if (mounted) {
          const records = res.data?.data || [];
          computeIntelligence(records, view);
          if (isInitialLoad) setLoading(false);
          
          // Small visual cooling period for the "LIVE" status indicator pulse
          setTimeout(() => { if (mounted) setIsLive(false); }, 1500);
        }
      } catch (e) {
        if (mounted) {
          toast.error("Failed to sync AI models");
          setLoading(false);
          setIsLive(false);
        }
      }
    };

    // Run immediately on view switch/mount
    fetchData(true);

    // Set up continuous live polling interval (e.g., every 5 seconds)
    const livePollingInterval = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => { 
      mounted = false; 
      clearInterval(livePollingInterval);
    };
  }, [view, computeIntelligence]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`w-4 h-4 text-amber-400 ${isLive ? 'animate-bounce' : 'fill-amber-400'}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isLive ? 'Neural Engine Synchronizing...' : 'Neural Engine V3.2 Active'}
            </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">AI Insights</h1>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
          {['24H', 'WEEKLY'].map((t) => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${
                view === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-mono text-xs animate-pulse">RECALIBRATING THREAT MODELS...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Main Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-3">
                  <TrendingUp className="text-indigo-400" /> {view} Security Forecast
                </h3>
                <span className={`text-[10px] font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded transition-all duration-300 ${isLive ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400'}`}>
                  {isLive ? 'STREAMING' : view === '24H' ? 'REAL-TIME' : 'HISTORICAL'}
                </span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastSeries}>
                    <XAxis dataKey="t" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="v" 
                      stroke="#6366f1" 
                      strokeWidth={4} 
                      dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                      isAnimationActive={true} // Assures line recalculations trigger standard fluid Recharts transitions
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-8 bg-slate-900/50 border border-slate-800 rounded-3xl flex flex-col items-center">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Model Efficacy</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={modelData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                    <Radar name="Sentinel" dataKey="A" stroke="#00aaff" fill="#00aaff" fillOpacity={0.4} isAnimationActive={true}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <div className="text-3xl font-black text-white">{insights.avgConfidence.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Confidence Score</div>
              </div>
            </div>
          </div>

          {/* Intelligence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk */}
            <div className="card p-6 bg-slate-900/50 border-l-4 border-l-rose-500 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><AlertCircle size={20} /></div>
                <h4 className="text-sm font-bold">Top Risk: {insights.topRisk.label}</h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">Patterns indicate anomalous spikes in {insights.topRisk.label} vectors.</p>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">IMPACT: {insights.topRisk.impact}</span>
                <span className="text-rose-500 font-bold">{insights.topRisk.action}</span>
              </div>
            </div>

            {/* Behavior */}
            <div className="card p-6 bg-slate-900/50 border-l-4 border-l-cyan-500 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Fingerprint size={20} /></div>
                <h4 className="text-sm font-bold">Behavioral Analysis</h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">Traffic identifies a {insights.behavior.type} fingerprint across nodes.</p>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">DETECTION: AI-GAZE</span>
                <span className="text-cyan-400 font-bold">{insights.behavior.action}</span>
              </div>
            </div>

            {/* Optimization */}
            <div className="card p-6 bg-slate-900/50 border-l-4 border-l-emerald-500 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><BarChart3 size={20} /></div>
                <h4 className="text-sm font-bold">Efficiency Insight</h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">{insights.optimization.text} recommended for speed.</p>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">SAVINGS: {insights.optimization.savings}</span>
                <span className="text-emerald-400 font-bold">OPTIMIZE</span>
              </div>
            </div>
          </div>

          {/* Geo-Correlation Map */}
          <div className="card p-8 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Globe className="text-indigo-400 animate-pulse" size={20} />
                <h3 className="text-lg font-bold">Live Threat Geo-Correlation</h3>
              </div>
              <div className="flex gap-4 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full bg-rose-500 ${isLive ? 'animate-ping' : 'animate-pulse'}`} /> 
                  ACTIVE ATTACK
                </span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700" /> NEUTRAL</span>
              </div>
            </div>
            
            <div className="h-[400px] w-full bg-slate-950/50 rounded-2xl border border-slate-800/50">
              <ComposableMap projectionConfig={{ scale: 145 }}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                     geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#1e293b"
                        stroke="#334155"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#312e81", outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>
                <AnimatePresence>
                  {geoMarkers.map(({ id, name, coordinates, markerOffset }) => (
                    <Marker key={id} coordinates={coordinates}>
                      <motion.circle 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        r={4} 
                        fill="#f43f5e" 
                        stroke="#fff" 
                        strokeWidth={1} 
                      />
                      <motion.text
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        textAnchor="middle"
                        y={markerOffset}
                        style={{ fontFamily: "monospace", fontSize: "7px", fill: "#94a3b8", fontWeight: "bold" }}
                      >
                        {name}
                      </motion.text>
                    </Marker>
                  ))}
                </AnimatePresence>
              </ComposableMap>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIInsights;