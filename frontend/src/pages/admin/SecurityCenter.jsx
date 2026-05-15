import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import useRBAC from '../../hooks/useRBAC';
import securityService from '../../services/security.service';
import ThreatMapModal from '../../components/ThreatMapModal';

const geoUrl = 'https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json';

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'CRITICAL': return '#f43f5e';
    case 'HIGH': return '#f97316';
    case 'MEDIUM': return '#eab308';
    case 'LOW': return '#10b981';
    default: return '#64748b';
  }
};

const SecurityCenter = () => {
  const { can } = useRBAC();
  const canManageSecurity = can('manage_security');

  const unwrapResponseData = (response, fallback) => response?.data?.data ?? response?.data ?? fallback;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [attackSurfaceData, setAttackSurfaceData] = useState([]);
  const [threatMapData, setThreatMapData] = useState(null);
  const [securityPolicies, setSecurityPolicies] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [showThreatMap, setShowThreatMap] = useState(false);
  const [patching, setPatching] = useState(false);
  const [patchResult, setPatchResult] = useState(null);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        setLoading(true);
        const [overviewRes, attackRes, threatMapRes, policiesRes, vulnRes] = await Promise.all([
          securityService.getOverview({ days: 7 }),
          securityService.getAttackSurface({ days: 1 }),
          securityService.getThreatMap({ days: 1, limit: 100 }),
          securityService.getPolicies(),
          securityService.getVulnerabilities()
        ]);

        setOverview(unwrapResponseData(overviewRes, null));
        setAttackSurfaceData(unwrapResponseData(attackRes, []));
        setThreatMapData(unwrapResponseData(threatMapRes, null));
        
        // Map policies to match UI format
        const mappedPolicies = unwrapResponseData(policiesRes, []).map(policy => ({
          ...policy,
          title: policy.title,
          status: policy.status,
          desc: policy.description,
          active: policy.active
        }));
        setSecurityPolicies(mappedPolicies);
        setVulnerabilities(unwrapResponseData(vulnRes, []));
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch security data');
        console.error('Error fetching security data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, []);

  const handlePatchSequence = async () => {
    try {
      setPatching(true);
      const response = await securityService.runPatchSequence({ days: 7, limit: 100 });
      setPatchResult(unwrapResponseData(response, null));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to run patch sequence');
      console.error('Patch sequence failed:', err);
    } finally {
      setPatching(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'text-rose-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'LOW': return 'text-emerald-500';
      default: return 'text-slate-500';
    }
  };

  const getRiskLevelBg = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-500/10';
      case 'HIGH': return 'bg-orange-500/10';
      case 'MEDIUM': return 'bg-yellow-500/10';
      case 'LOW': return 'bg-emerald-500/10';
      default: return 'bg-slate-500/10';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-indigo-500 animate-spin" size={48} />
          <p className="text-slate-400 font-mono">Loading security data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertOctagon className="text-rose-500 mx-auto mb-4" size={48} />
          <p className="text-rose-500 font-mono">{error}</p>
        </div>
      </div>
    );
  }

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
        
        {overview && (
          <div className={`${getRiskLevelBg(overview.riskLevel)} border border-slate-800 p-4 rounded-2xl flex items-center gap-6`}>
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase">Risk Level</p>
              <p className={`text-lg font-black ${getRiskLevelColor(overview.riskLevel)}`}>{overview.riskLevel}</p>
            </div>
            <div className="w-[1px] h-8 bg-slate-800" />
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase">Protection Score</p>
              <p className="text-lg font-black text-white tracking-widest">{overview.protectionScore}/100</p>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Threat Map & Analytics - Left Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Global Threat Map */}
          <div className="relative h-[400px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50" />
            </div>

            <div className="absolute top-6 left-6 z-20 space-y-1">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Globe size={16} className="text-indigo-400" /> Live Attack Origin Map
              </h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Inbound Traffic Vectorization</p>
            </div>

            <div className="absolute inset-0 z-10">
              <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 145 }} style={{ width: '100%', height: '100%' }}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) => geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: '#0f172a', stroke: '#1e293b', outline: 'none' },
                        hover: { fill: '#111827', stroke: '#334155', outline: 'none' },
                        pressed: { fill: '#111827', stroke: '#334155', outline: 'none' }
                      }}
                    />
                  ))}
                </Geographies>

                {(threatMapData?.threats || []).map((threat, index) => (
                  <Marker key={`${threat.sourceIp}-${index}`} coordinates={[threat.longitude, threat.latitude]}>
                    <g>
                      <circle
                        r={Math.max(8, Math.min(28, (threat.threatCount || 1) * 2))}
                        fill="none"
                        stroke={getSeverityColor(threat.severity)}
                        strokeWidth="1"
                        opacity="0.25"
                      />
                      <circle
                        r={4 + Math.min(8, threat.threatCount || 1)}
                        fill={getSeverityColor(threat.severity)}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    </g>
                  </Marker>
                ))}
              </ComposableMap>
            </div>

            <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end gap-4">
              <div className="flex gap-4 flex-wrap">
                <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Top Source</p>
                  <p className="text-xs font-bold text-white">{threatMapData?.threats?.[0]?.location || 'Frankfurt, DE'}</p>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Detected Threats</p>
                  <p className="text-xs font-bold text-rose-500">{threatMapData?.totalThreats?.toLocaleString() || '0'} Total</p>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Origin Points</p>
                  <p className="text-xs font-bold text-indigo-400">{threatMapData?.totalLocations || 0}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowThreatMap(true)}
                disabled={!canManageSecurity}
                title={canManageSecurity ? 'Open detailed threat map' : 'Permission required: manage_security'}
                className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-widest transition-all ${
                  canManageSecurity
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                View Detailed Map
              </button>
            </div>
          </div>

          {/* Attack Surface Graph */}
          <div className="card p-6 bg-slate-900/20 border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">
              Attack Attempts by Hour (24h)
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attackSurfaceData.length > 0 ? attackSurfaceData : []}>
                  <XAxis dataKey="name" hide stroke="#475569" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                  <Area 
                    type="stepAfter" 
                    dataKey="attempts" 
                    stroke="#f43f5e" 
                    fill="#f43f5e" 
                    fillOpacity={0.1} 
                    strokeWidth={2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Global Policy Panel - Right Column */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="card p-6 bg-slate-900/40 border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Lock size={16} className="text-indigo-400" /> Active Policies ({securityPolicies.length})
            </h3>
            <div className="space-y-4">
              {securityPolicies.map((policy) => (
                <div key={policy.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 group hover:border-indigo-500/30 transition-all">
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
          {vulnerabilities.length > 0 && (
            <div className="card p-6 border-rose-500/20 bg-rose-500/5 shadow-2xl shadow-rose-500/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-500 rounded-lg text-white">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Urgent Advisory</h3>
              </div>
              <div className="space-y-4">
                {vulnerabilities.slice(0, 1).map((vuln) => (
                  <div key={vuln.id} className="flex gap-4">
                    <div className="w-1 h-auto bg-rose-500 rounded-full" />
                    <div>
                      <p className="text-xs font-bold text-white">{vuln.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
                        {vuln.cveId}: {vuln.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handlePatchSequence}
                disabled={!canManageSecurity || patching}
                title={canManageSecurity ? 'Initiate patch sequence' : 'Permission required: manage_security'}
                className={`w-full mt-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  canManageSecurity && !patching
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {patching ? 'Processing...' : 'Initiate Patch Sequence'}
              </button>
            </div>
          )}

          {patchResult && (
            <div className="card p-6 bg-slate-900/40 border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Patch Sequence Result</h3>
              <div className="grid grid-cols-2 gap-3 text-[10px] mb-4">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-slate-500 uppercase font-black">Risk Level</p>
                  <p className="text-white font-bold mt-1">{patchResult.riskLevel}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-slate-500 uppercase font-black">Risk Score</p>
                  <p className="text-white font-bold mt-1">{patchResult.riskScore}/100</p>
                </div>
              </div>
              {Array.isArray(patchResult.recommendations) && patchResult.recommendations.length > 0 && (
                <div className="space-y-2 mb-4">
                  {patchResult.recommendations.map((item, index) => (
                    <div key={index} className="text-[10px] text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>
              )}
              {Array.isArray(patchResult.actions) && patchResult.actions.length > 0 && (
                <div className="space-y-2">
                  {patchResult.actions.map((action, index) => (
                    <div key={index} className="text-[10px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                      {action.title}: {Array.isArray(action.targets) ? action.targets.length : 0} target(s)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Encryption Status Card */}
          <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl relative overflow-hidden">
            <Fingerprint className="absolute -right-4 -bottom-4 text-indigo-500 opacity-10" size={100} />
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Crypto Engine</h4>
            <p className="text-xl font-black text-white">AES-XTS 256</p>
            <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">FIPS 140-2 Validated Ingress</p>
          </div>

        </div>
      </div>

      {/* Threat Map Modal */}
      {showThreatMap && (
        <ThreatMapModal isOpen={showThreatMap} onClose={() => setShowThreatMap(false)} />
      )}
    </div>
  );
};

export default SecurityCenter;