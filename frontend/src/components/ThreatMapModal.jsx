/**
 * Threat Map Modal Component
 * Displays geo-locations of threats from SIEM dataset records
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, AlertTriangle, Loader2, Globe } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import securityService from '../services/security.service';

const geoUrl = 'https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json';

const ThreatMapModal = ({ isOpen, onClose }) => {
  const [threatMap, setThreatMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  useEffect(() => {
    if (!isOpen) return;

    const fetchThreatMap = async () => {
      try {
        setLoading(true);
        const response = await securityService.getThreatMap({ days: 1 });
        setThreatMap(response.data?.data || response.data || null);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch threat map');
        console.error('Error fetching threat map:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreatMap();
  }, [isOpen]);

  const filteredThreats = threatMap?.threats?.filter((threat) => {
    if (filterSeverity === 'ALL') return true;
    return threat.severity === filterSeverity;
  }) || [];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-rose-500';
      case 'HIGH':
        return 'text-orange-500';
      case 'MEDIUM':
        return 'text-yellow-500';
      case 'LOW':
        return 'text-emerald-500';
      default:
        return 'text-slate-500';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/10 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'LOW':
        return 'bg-emerald-500/10 border-emerald-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900/50 border-b border-slate-800 p-6 flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
              <MapPin size={14} /> Global Threat Intelligence
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Live Attack Origin Map
            </h2>
            {threatMap && (
              <p className="text-[10px] text-slate-500 font-mono uppercase">
                {threatMap.totalThreats} threats detected • {threatMap.totalLocations} origin points
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Map Area */}
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="text-indigo-500 animate-spin" size={48} />
                  <p className="text-slate-400 font-mono">Loading threat intelligence...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="text-rose-500 mx-auto mb-4" size={48} />
                  <p className="text-rose-500 font-mono">{error}</p>
                </div>
              </div>
            ) : (
              <div className="relative flex-1 bg-slate-950 border-r border-slate-800 overflow-hidden">
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

                  {filteredThreats.map((threat, idx) => {
                    const color = threat.severity === 'CRITICAL'
                      ? '#f43f5e'
                      : threat.severity === 'HIGH'
                      ? '#f97316'
                      : threat.severity === 'MEDIUM'
                      ? '#eab308'
                      : '#10b981';

                    return (
                      <Marker key={idx} coordinates={[threat.longitude, threat.latitude]} onClick={() => setSelectedThreat(threat)}>
                        <g className="cursor-pointer">
                          <circle r={Math.max(8, Math.min(28, (threat.threatCount || 1) * 2))} fill="none" stroke={color} strokeWidth="1" opacity="0.28" />
                          <circle r={4 + Math.min(8, threat.threatCount || 1)} fill={color} stroke="#0f172a" strokeWidth="1.5" />
                        </g>
                      </Marker>
                    );
                  })}
                </ComposableMap>

                {/* Overlay info */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                  <div className="flex gap-4">
                    <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Filter by Severity</p>
                      <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="mt-2 px-2 py-1 text-[10px] font-bold bg-slate-950 border border-slate-700 rounded text-white cursor-pointer pointer-events-auto"
                      >
                        <option value="ALL">All Threats</option>
                        <option value="CRITICAL">Critical Only</option>
                        <option value="HIGH">High+ Only</option>
                        <option value="MEDIUM">Medium+ Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-6 left-6 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 space-y-2">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-3">Severity Legend</p>
                  <div className="flex flex-col gap-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-rose-500 rounded-full" />
                      <span className="text-white">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-white">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-white">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span className="text-white">Low</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Threat List */}
          <div className="w-96 border-l border-slate-800 overflow-y-auto bg-slate-900/20">
            <div className="p-4 border-b border-slate-800 sticky top-0 bg-slate-950/50 backdrop-blur-sm">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">
                Threat Origins ({filteredThreats.length})
              </h3>
            </div>

            <div className="p-4 space-y-3">
              {filteredThreats.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No threats matching filter</p>
              ) : (
                filteredThreats.map((threat, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedThreat(threat)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedThreat?.sourceIp === threat.sourceIp
                        ? `${getSeverityBg(threat.severity)} ring-2 ring-indigo-500`
                        : 'bg-slate-900/30 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{threat.location}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{threat.sourceIp}</p>
                      </div>
                      <span
                        className={`text-[8px] font-black px-2 py-0.5 rounded ${getSeverityColor(
                          threat.severity
                        )}`}
                      >
                        {threat.severity}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 mb-2">
                      <div>
                        <span className="font-bold text-slate-300">Attempts:</span> {threat.threatCount}
                      </div>
                      <div>
                        <span className="font-bold text-slate-300">Ports:</span> {threat.ports.slice(0, 2).join(',')}
                      </div>
                    </div>

                    {threat.protocols.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {threat.protocols.slice(0, 3).map((proto, i) => (
                          <span
                            key={i}
                            className="text-[8px] px-2 py-0.5 bg-slate-800 rounded text-slate-300"
                          >
                            {proto}
                          </span>
                        ))}
                      </div>
                    )}

                    {selectedThreat?.sourceIp === threat.sourceIp && (
                      <div className="mt-3 pt-3 border-t border-slate-700 text-[9px] text-slate-400">
                        <p>
                          <strong>Last Seen:</strong> {new Date(threat.lastSeen).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default ThreatMapModal;
