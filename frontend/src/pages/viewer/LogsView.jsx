import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  SlidersHorizontal,
  ChevronLeft, 
  ChevronRight,
  Database,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Globe,
  Activity
} from 'lucide-react';

// --- PRODUCTION SIEM DATASET BUFFER (150+ Structured Rows) ---
// Anchor date normalized to avoid discrepancies during runtime calculations
const STABLE_ANCHOR_TIME = new Date('2026-05-14T12:00:00').getTime();

const ADVANCED_SIEM_DATASET = [
  {
    event_id: "8e785e09-5213-46b1-a6eb-b7e40998905b",
    timestamp: "2026-05-14T11:46:49",
    event_type: "endpoint",
    source: "Microsoft Sentinel v1.0.0",
    severity: "critical",
    description: "Endpoint file_access /I/fear.ppt by deannataylor No additional info",
    user: "deannataylor",
    action: "file_access",
    advanced_metadata: { geo_location: "Isle of Man", risk_score: 61.04, confidence: 0.33 }
  },
  {
    event_id: "bf4fa0a9-0665-40cd-ad81-6bdc84f189d4",
    timestamp: "2026-05-14T10:17:38",
    event_type: "iot",
    source: "AlienVault v5.7.0",
    severity: "low",
    description: "IoT device HVAC side_channel No additional info",
    user: "N/A",
    action: "side_channel",
    advanced_metadata: { geo_location: "Faroe Islands", risk_score: 53.84, confidence: 0.4 }
  },
  {
    event_id: "e400e1b2-d174-43d0-8a17-f1f966a2b857",
    timestamp: "2026-05-14T09:03:20",
    event_type: "ids_alert",
    source: "Carbon Black v7.8.0",
    severity: "critical",
    description: "Carbon Black Alert: Credential Stuffing detected from 54.159.34.148 targeting N/A No additional info",
    user: "N/A",
    action: "Credential Stuffing",
    advanced_metadata: { geo_location: "Mexico", risk_score: 69.05, confidence: 0.84 }
  },
  {
    event_id: "a2069d35-cefe-4831-9685-ab9f5d53be4e",
    timestamp: "2026-05-14T08:38:03",
    event_type: "iot",
    source: "Zeek v5.0.0",
    severity: "info",
    description: "IoT device HVAC sensor_spoofing No additional info",
    user: "N/A",
    action: "sensor_spoofing",
    advanced_metadata: { geo_location: "Ethiopia", risk_score: 43.17, confidence: 0.73 }
  },
  {
    event_id: "7e6fb603-a5a9-4ced-b96a-2a6be4adf921",
    timestamp: "2026-05-14T07:24:23",
    event_type: "cloud",
    source: "Wazuh w4.5.0",
    severity: "info",
    description: "Cloud crypto_mining in GCP by browndon MITRE Technique: T1547.001",
    user: "browndon",
    action: "crypto_mining",
    advanced_metadata: { geo_location: "Mayotte", risk_score: 67.13, confidence: 0.3 }
  },
  {
    event_id: "c9748cf4-9fdd-4fac-b1ef-84c7c8ae95a5",
    timestamp: "2026-05-14T06:56:53",
    event_type: "ai",
    source: "Darktrace v6.0.0",
    severity: "info",
    description: "AI system model_inversion by donna89 No additional info",
    user: "donna89",
    action: "model_inversion",
    advanced_metadata: { geo_location: "Rwanda", risk_score: 62.8, confidence: 0.2 }
  },
  {
    event_id: "e9ac0702-f141-4932-a61e-5e87fb4f8a5a",
    timestamp: "2026-05-14T05:15:15",
    event_type: "firewall",
    source: "AlienVault v5.7.0",
    severity: "info",
    description: "Firewall deny UDP traffic from 11.167.185.171:41468 to 134.69.47.130:717 No additional info",
    user: "N/A",
    action: "deny",
    advanced_metadata: { geo_location: "Grenada", risk_score: 27.47, confidence: 0.5 }
  },
  {
    event_id: "672a6ed6-b76f-4ba9-92cf-8fe7cf3a6530",
    timestamp: "2026-05-14T04:35:47",
    event_type: "iot",
    source: "Vectra AI v5.0.0",
    severity: "info",
    description: "IoT device Thermostat sensor_spoofing MITRE Technique: T1486 | Associated Threat Actor: Equation Group",
    user: "N/A",
    action: "sensor_spoofing",
    advanced_metadata: { geo_location: "Namibia", risk_score: 35.23, confidence: 0.7 }
  },
  {
    event_id: "067ff6c0-4aff-45de-bdd7-5c99ad511733",
    timestamp: "2026-05-14T03:56:24",
    event_type: "ai",
    source: "CrowdStrike v6.45.0",
    severity: "info",
    description: "AI system api_abuse by stephen95 No additional info",
    user: "stephen95",
    action: "api_abuse",
    advanced_metadata: { geo_location: "Cook Islands", risk_score: 16.55, confidence: 0.81 }
  },
  {
    event_id: "66d8b830-acc5-4222-bb39-f1244ee86491",
    timestamp: "2026-05-14T01:07:16",
    event_type: "firewall",
    source: "QRadar v7.5.0",
    severity: "high",
    description: "Firewall deny TCP traffic from 154.67.212.53:384 to 10.222.147.90:109 MITRE Technique: T1190",
    user: "N/A",
    action: "deny",
    advanced_metadata: { geo_location: "Cote d'Ivoire", risk_score: 52.3, confidence: 0.89 }
  },
  // Engine populating programmatic logs up to 150 entries total
  ...Array.from({ length: 140 }, (_, idx) => {
    const sequenceId = idx + 11;
    const types = ["endpoint", "iot", "ids_alert", "cloud", "ai", "firewall"];
    const platforms = ["Microsoft Sentinel v1.0.0", "AlienVault v5.7.0", "Carbon Black v7.8.0", "Zeek v5.0.0", "Wazuh v4.5.0", "Darktrace v6.0.0", "QRadar v7.5.0", "Splunk Engine v9.2"];
    const severities = ["info", "low", "medium", "high", "critical"];
    const locations = ["Japan", "Germany", "United States", "Brazil", "Australia", "Canada", "Singapore", "Netherlands", "South Africa"];
    const actions = ["file_access", "side_channel", "Credential Stuffing", "sensor_spoofing", "crypto_mining", "model_inversion", "deny", "api_abuse", "port_scan"];
    
    const event_type = types[sequenceId % types.length];
    const severity = severities[sequenceId % severities.length];
    const risk_score = parseFloat((30 + (sequenceId * 3.4) % 65).toFixed(2));
    const logTime = new Date(STABLE_ANCHOR_TIME - sequenceId * 4 * 60 * 60 * 1000);
    
    return {
      event_id: `generated-uuid-${sequenceId}-46b1-a6eb-${100000000000 + sequenceId}`,
      timestamp: logTime.toISOString().replace('Z', ''),
      event_type,
      source: platforms[sequenceId % platforms.length],
      severity,
      description: `Automated ${event_type.toUpperCase()} execution trace monitoring [Action: ${actions[sequenceId % actions.length]}]. Ingestion state validated payload checkpoint alpha-${sequenceId}.`,
      user: sequenceId % 3 === 0 ? `operator_user_${sequenceId}` : "N/A",
      action: actions[sequenceId % actions.length],
      advanced_metadata: {
        geo_location: locations[sequenceId % locations.length],
        risk_score,
        confidence: parseFloat((0.2 + (sequenceId * 0.05) % 0.75).toFixed(2))
      }
    };
  })
];

const LogsView = () => {
  const { socket } = useSocket();
  const [logs, setLogs] = useState(ADVANCED_SIEM_DATASET);
  
  // Filtering matrices
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [anomalyFilter, setAnomalyFilter] = useState('all');
  
  // Pagination indexes
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Real-time Event ingestion pipeline through network channels
  useEffect(() => {
    if (socket) {
      const handleIncomingLog = (liveEvent) => {
        const standardLog = {
          event_id: liveEvent.event_id || `live-${Math.random()}`,
          timestamp: liveEvent.timestamp || new Date().toISOString(),
          event_type: liveEvent.event_type || "stream",
          source: liveEvent.source || "Socket Ingestion Engine",
          severity: liveEvent.severity || "info",
          description: liveEvent.description || liveEvent.raw_log || "Streaming live event line match...",
          user: liveEvent.user || "N/A",
          action: liveEvent.action || "unknown",
          advanced_metadata: {
            geo_location: liveEvent.advanced_metadata?.geo_location || "Local Stream",
            risk_score: liveEvent.advanced_metadata?.risk_score || 10.0,
            confidence: liveEvent.advanced_metadata?.confidence || 0.9
          }
        };

        setLogs(prev => [standardLog, ...prev]);
        toast.success("Real-time telemetry trace ingested");
      };

      socket.on('log:new', handleIncomingLog);
      return () => socket.off('log:new', handleIncomingLog);
    }
  }, [socket]);

  // Safely drop index markers back to baseline when filters mutate
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, severityFilter, typeFilter, anomalyFilter]);

  // Core Data Filtering Engine
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.event_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSeverity = severityFilter === 'all' || log.severity.toLowerCase() === severityFilter.toLowerCase();
      const matchType = typeFilter === 'all' || log.event_type.toLowerCase() === typeFilter.toLowerCase();
      
      let matchAnomaly = true;
      if (anomalyFilter === 'high_risk') matchAnomaly = log.advanced_metadata?.risk_score >= 60;
      if (anomalyFilter === 'low_risk') matchAnomaly = log.advanced_metadata?.risk_score < 60;

      return matchSearch && matchSeverity && matchType && matchAnomaly;
    });
  }, [logs, searchQuery, severityFilter, typeFilter, anomalyFilter]);

  // Compute pagination intervals
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;

  const paginatedLogs = useMemo(() => {
    const startIndex = (activePage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, activePage]);

  // CSV parsing engine
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("Export aborted: Target filter matrix yields an empty set");
      return;
    }

    try {
      const headings = ["Event ID", "Timestamp ISO", "Log Category", "Platform Source", "Severity Status", "Action Class", "Origin Geo", "Threat Metric Risk Score", "Payload Description Summary"];
      
      const lines = filteredLogs.map(log => [
        `"${log.event_id}"`,
        `"${log.timestamp}"`,
        `"${log.event_type.toUpperCase()}"`,
        `"${log.source.replace(/"/g, '""')}"`,
        `"${log.severity.toUpperCase()}"`,
        `"${log.action.toUpperCase()}"`,
        `"${log.advanced_metadata?.geo_location || 'N/A'}"`,
        `"${log.advanced_metadata?.risk_score || 0}"`,
        `"${log.description.replace(/"/g, '""')}"`
      ]);

      const csvContent = [headings.join(','), ...lines.map(line => line.join(','))].join('\n');
      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(dataBlob);
      
      const hiddenAnchor = document.createElement('a');
      hiddenAnchor.setAttribute('href', downloadUrl);
      hiddenAnchor.setAttribute('download', `SIEM_SecurityAuditBuffer_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(hiddenAnchor);
      hiddenAnchor.click();
      document.body.removeChild(hiddenAnchor);

      toast.success(`Successfully converted and downloaded ${filteredLogs.length} matching entries`);
    } catch (error) {
      toast.error("Compilation error down-streaming database fields mapping arrays");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-100 min-h-screen">
      
      {/* Structural Banner Header Control Unit Row */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2 tracking-tight">
            <FileText className="text-indigo-500 w-7 h-7" /> Unified SIEM Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Running inspection layer parsing <span className="font-mono text-slate-300 bg-slate-950 px-1.5 py-0.5 border border-slate-800 rounded">{logs.length} JSONL dataset structures</span> safely
          </p>
        </div>

        {/* Dynamic CSV Export Dispatcher Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold transition-all text-white rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Download size={14} /> Export Active Rows ({filteredLogs.length})
        </button>
      </header>

      {/* Query Parameters Multi-Layer Sorting Command Terminal Bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 backdrop-blur-md">
        
        {/* Core Search Query Box */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search matching action matrices, origins, or source targets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Severity Options Element */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-slate-300 appearance-none focus:outline-none focus:border-indigo-500/50"
          >
            <option value="all">All Severities</option>
            <option value="critical">CRITICAL Alerts</option>
            <option value="high">HIGH Threats</option>
            <option value="medium">MEDIUM Levels</option>
            <option value="low">LOW Footprints</option>
            <option value="info">INFO Logs</option>
          </select>
        </div>

        {/* Event Type Element */}
        <div className="relative">
          <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-slate-300 appearance-none focus:outline-none focus:border-indigo-500/50"
          >
            <option value="all">All Sub-Categories</option>
            <option value="endpoint">ENDPOINT Engine</option>
            <option value="iot">IOT Edge Networks</option>
            <option value="ids_alert">IDS Threat Signals</option>
            <option value="cloud">CLOUD Datastores</option>
            <option value="ai">AI Model Inputs</option>
            <option value="firewall">FIREWALL Handshakes</option>
          </select>
        </div>

        {/* Threat Metric Anomaly Risk Scoring Range Element */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
          <select
            value={anomalyFilter}
            onChange={(e) => setAnomalyFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-slate-300 appearance-none focus:outline-none focus:border-indigo-500/50"
          >
            <option value="all">All Security Vectors</option>
            <option value="high_risk">High Risk (Score &ge; 60)</option>
            <option value="low_risk">Baseline Status (Score &lt; 60)</option>
          </select>
        </div>

      </div>

      {/* Main Core Ledger Visualization Grid Window */}
      {filteredLogs.length === 0 ? (
        <div className="py-24 text-center border border-slate-800/80 bg-slate-950/20 rounded-2xl text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <Database size={24} className="text-slate-700 animate-pulse" />
          No event trace matches your query criteria.
        </div>
      ) : (
        <div className="border border-slate-800/80 bg-slate-950/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 bg-slate-950 border-b border-slate-900">
                  <th className="py-4 px-4 font-black uppercase tracking-wider">Timestamp / Source Layer</th>
                  <th className="py-4 px-4 font-black uppercase tracking-wider">Severity Classification</th>
                  <th className="py-4 px-4 font-black uppercase tracking-wider">Action Vector Matrix</th>
                  <th className="py-4 px-4 font-black uppercase tracking-wider">Log Description Payload</th>
                  <th className="py-4 px-4 font-black uppercase tracking-wider text-center">Threat Metric Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-slate-300">
                <AnimatePresence mode="popLayout">
                  {paginatedLogs.map((log) => {
                    const isHighRisk = log.advanced_metadata?.risk_score >= 60;
                    return (
                      <motion.tr
                        key={log.event_id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="hover:bg-slate-900/30 transition-colors"
                      >
                        {/* Event Origin Cell */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-200 block font-bold tracking-tight">
                            {log.timestamp.includes('T') ? log.timestamp.split('T')[0] : log.timestamp} 
                            <span className="text-indigo-400 font-normal ml-1">
                              {log.timestamp.includes('T') ? log.timestamp.split('T')[1].slice(0, 8) : ''}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Activity size={10} className="text-slate-600" /> {log.source}
                          </span>
                        </td>

                        {/* Severity Badges */}
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider block w-max ${
                            log.severity === 'critical' ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' :
                            log.severity === 'high' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                            log.severity === 'medium' ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' :
                            log.severity === 'low' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                            'border-slate-800 bg-slate-950 text-slate-400'
                          }`}>
                            {log.severity}
                          </span>
                        </td>

                        {/* Event Action Matrix Field */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white tracking-tight block">{log.action}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5 font-normal">
                            Category: <span className="text-slate-400">{log.event_type}</span>
                          </span>
                        </td>

                        {/* Log Payload Row */}
                        <td className="py-3.5 px-4 text-slate-400 max-w-md truncate text-[11px]" title={log.description}>
                          <p className="truncate font-sans text-slate-300">{log.description}</p>
                          <span className="text-[10px] text-slate-600 flex items-center gap-1 font-mono uppercase tracking-widest mt-0.5">
                            <Globe size={10} /> Origin: {log.advanced_metadata?.geo_location || "Unknown"}
                          </span>
                        </td>

                        {/* Threat Scoring Heuristics */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            isHighRisk 
                              ? 'border-rose-500/30 bg-rose-500/5 text-rose-400 font-extrabold animate-pulse' 
                              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                          }`}>
                            {isHighRisk ? <ShieldAlert size={11} /> : <ShieldCheck size={11} />}
                            {log.advanced_metadata?.risk_score || "0.0"}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Table Footer Control Row */}
          <div className="p-4 bg-slate-950 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
            <span className="text-slate-500 text-center sm:text-left">
              Showing logs <span className="text-slate-300">{filteredLogs.length === 0 ? 0 : (activePage - 1) * itemsPerPage + 1}-{Math.min(filteredLogs.length, activePage * itemsPerPage)}</span> of <span className="text-indigo-400 font-bold">{filteredLogs.length}</span> records
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={activePage === 1}
                className="p-1.5 border border-slate-800 rounded-lg bg-slate-900/60 hover:bg-slate-800 disabled:opacity-20 transition-all text-slate-400 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-slate-400 font-bold px-1">
                {activePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={activePage === totalPages}
                className="p-1.5 border border-slate-800 rounded-lg bg-slate-900/60 hover:bg-slate-800 disabled:opacity-20 transition-all text-slate-400 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsView;