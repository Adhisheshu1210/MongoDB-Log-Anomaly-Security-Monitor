import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Search, 
  Download, 
  Trash2, 
  Play, 
  Pause, 
  Filter, 
  ChevronRight, 
  FileJson, 
  Terminal,
  Activity,
  ToggleLeft
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { logsAPI, siemDatasetAPI } from '../../services/api';
import useRBAC from '../../hooks/useRBAC';

const Logs = () => {
  const { socket } = useSocket();
  const { canAny } = useRBAC();
  const [logs, setLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filter, setFilter] = useState({ level: 'all', search: '' });
  const [expandedLog, setExpandedLog] = useState(null);
  const [showSiemData, setShowSiemData] = useState(false);
  const [siemLogs, setSiemLogs] = useState([]);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const scrollRef = useRef(null);

  const fetchInitialLogs = useCallback(async () => {
    try {
      const res = await logsAPI.getLogs({ limit: 50 });
      setLogs(res.data);
    } catch (err) {
      toast.error("Failed to fetch log history");
    }
  }, []);

  const fetchSiemLogs = useCallback(async () => {
    try {
      const res = await siemDatasetAPI.getAll({ limit: 50 });
      const formattedSiem = (res.data?.data || []).map(record => ({
        _id: record.id,
        timestamp: record.timestamp,
        severity: record.severity || 'UNKNOWN',
        classification: record.classification || 'unknown',
        message: `${record.classification}: ${record.source || 'unknown'} - Anomaly: ${record.isAnomaly ? 'Yes' : 'No'}`,
        metadata: record.record,
        isAnomaly: record.isAnomaly,
        anomalyScore: record.anomalyScore,
        source: record.source
      }));
      setSiemLogs(formattedSiem);
    } catch (err) {
      // Silently fail if SIEM data unavailable
    }
  }, []);

  useEffect(() => {
    fetchInitialLogs();
    fetchSiemLogs();
  }, [fetchInitialLogs, fetchSiemLogs]);

  useEffect(() => {
    const allLogs = showSiemData ? [...logs, ...siemLogs] : logs;
    setDisplayedLogs(allLogs);
  }, [logs, siemLogs, showSiemData]);

  useEffect(() => {
    if (socket && isStreaming) {
      socket.on('log:new', (newLog) => {
        setLogs(prev => [newLog, ...prev].slice(0, 100));
      });
      return () => socket.off('log:new');
    }
  }, [socket, isStreaming]);

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'text-rose-500';
      case 'warn': return 'text-amber-500';
      case 'debug': return 'text-indigo-400';
      case 'critical': return 'text-rose-600 font-bold';
      case 'high': return 'text-amber-600 font-bold';
      default: return 'text-emerald-400';
    }
  };

  const filteredLogs = displayedLogs.filter(log => {
    const level = (log.level || log.severity || '').toLowerCase();
    const matchesLevel = filter.level === 'all' || level === filter.level;
    const matchesSearch = log.message?.toLowerCase().includes(filter.search.toLowerCase()) || 
                          log._id?.includes(filter.search);
    return matchesLevel && matchesSearch;
  });

  const canExportLogs = canAny(['view_all_logs', 'view_logs']);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Terminal className="text-cyan-400" /> Log Stream
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              {isStreaming ? 'Live Ingestion Active' : 'Stream Paused'} {showSiemData && '| SIEM Dataset Enabled'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter by message or ID..."
              className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white w-full lg:w-64 focus:ring-2 focus:ring-cyan-500/50 transition-all"
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
            />
          </div>
          
          <button 
            onClick={() => setShowSiemData(!showSiemData)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              showSiemData ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
            title="Toggle SIEM dataset logs"
          >
            <ToggleLeft size={14} /> SIEM
          </button>

          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isStreaming ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}
          >
            {isStreaming ? <><Pause size={14} /> Stop</> : <><Play size={14} /> Resume</>}
          </button>

          {canExportLogs && (
            <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <Download size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Log Console Container */}
      <div className="card border-slate-800 bg-slate-950/80 rounded-2xl overflow-hidden shadow-2xl">
        {/* Console Header */}
        <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
            {showSiemData ? `mongodb-replica-set-01 + siem-dataset [${filteredLogs.length} records]` : 'mongodb-replica-set-01'}
          </span>
        </div>

        {/* Console Body */}
        <div className="h-[600px] overflow-y-auto font-mono p-2 custom-scrollbar" ref={scrollRef}>
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log._id || index}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`group text-[12px] leading-6 py-0.5 px-2 rounded hover:bg-slate-800/40 transition-colors cursor-pointer ${expandedLog === log._id ? 'bg-slate-800/60' : ''}`}
                  onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-slate-600 shrink-0 w-24">
                      {format(new Date(log.timestamp || log.createdAt || Date.now()), 'HH:mm:ss.SSS')}
                    </span>
                    <span className={`shrink-0 w-20 font-bold uppercase ${getLevelColor(log.level || log.severity)}`}>
                      [{log.level || log.severity || 'INFO'}]
                    </span>
                    <span className="text-slate-300 flex-1 truncate group-hover:text-white">
                      {log.message}
                    </span>
                    {log.isAnomaly && <span className="text-rose-500 text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 rounded">ANOMALY</span>}
                    <ChevronRight className={`w-3 h-3 mt-1.5 text-slate-600 transition-transform ${expandedLog === log._id ? 'rotate-90' : ''}`} />
                  </div>

                  {/* Expanded Detail View */}
                  {expandedLog === log._id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-2 mb-2 p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-3 text-cyan-400">
                        <FileJson size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Metadata Payload</span>
                      </div>
                      <pre className="text-indigo-300 text-[11px] whitespace-pre-wrap">
                        {JSON.stringify(log.metadata || log, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-slate-900/80 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Database size={10} /> {filteredLogs.length} Records</span>
            <span className="flex items-center gap-1"><Activity size={10} /> {isStreaming ? 'Auto-Scrolling' : 'Static'}</span>
          </div>
          <span className="text-indigo-400">USR@KAFKA-MDB:~$</span>
        </div>
      </div>
    </div>
  );
};

export default Logs;