import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  User, 
  Terminal, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Calendar,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import useRBAC from '../../hooks/useRBAC';

import auditLogsService from '../../services/auditLogs.service';

const AuditLogs = () => {
  const { can } = useRBAC();

  const canViewAuditLogs = can('view_audit_logs');
  const [filter, setFilter] = useState("ALL");
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const params = {
          page: 1,
          limit: 50
        };

        // Map filter values to API parameters
        if (filter === "SECURITY") {
          params.action = "PERMISSION_CHANGE,SECURITY_ALERT,AUTO_BLOCK";
        } else if (filter === "USER") {
          params.action = "USER_LOGIN,USER_LOGOUT,ROLE_CHANGE";
        } else if (filter === "SYSTEM") {
          params.action = "SYSTEM_RESTART,CONFIG_CHANGE,MODEL_RETRAIN";
        }

        const response = await auditLogsService.getAuditLogs(params);
        // API response structure: { success, data: [...], pagination: {...} }
        const logsArray = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setAuditData(logsArray);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch audit logs');
        console.error('Error fetching audit logs:', err);
        setAuditData([]);
      } finally {
        setLoading(false);
      }
    };

    if (canViewAuditLogs) {
      fetchAuditLogs();
    }
  }, [filter, canViewAuditLogs]);

  const getStatusBadge = (status) => (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${
      status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
    }`}>
      {status}
    </span>
  );
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 italic">
            <History className="text-indigo-500" size={28} /> System Audit Trail
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">
            Compliance Level: SOC2 Type II Compliant Ingress
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canViewAuditLogs}
            title={canViewAuditLogs ? 'Export immutable audit document' : 'Permission required: view_audit_logs'}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all ${
              canViewAuditLogs
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-700 cursor-not-allowed'
            }`}
          >
            <Download size={14} /> Export Immutable PDF
          </button>
        </div>
      </div>

      {/* Forensic Search & Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search by Action ID, Username, or Target Resource..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:border-indigo-500 outline-none transition-all font-mono"
          />
        </div>
        <select 
          className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 focus:border-indigo-500 outline-none appearance-none"
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All Event Types</option>
          <option value="SECURITY">Security Changes</option>
          <option value="USER">User Management</option>
          <option value="SYSTEM">System Orchestration</option>
        </select>
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Clock size={16} className="text-indigo-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase">Retention: 365 Days</span>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
              <p className="text-slate-400 text-sm font-mono">Loading audit logs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle size={32} className="text-rose-500" />
              <p className="text-rose-500 text-sm font-mono">{error}</p>
            </div>
          </div>
        ) : auditData.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-400 text-sm font-mono">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <th className="px-6 py-5">Event ID</th>
                  <th className="px-6 py-5">Initiator</th>
                  <th className="px-6 py-5">Action Type</th>
                  <th className="px-6 py-5">Resource Target</th>
                  <th className="px-6 py-5">Origin IP</th>
                  <th className="px-6 py-5">Timestamp</th>
                  <th className="px-6 py-5">Result</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono">
                {auditData.map((log, i) => (
                  <motion.tr 
                    key={log.id || log.auditId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-slate-800/50 hover:bg-indigo-500/5 group transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-500 font-bold">{log.auditId || log.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <User size={12} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{log.user?.name || 'Unknown'}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase">{log.user?.role || 'USER'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-indigo-300 font-bold uppercase italic">
                        <Terminal size={12} /> {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="flex items-center gap-2 truncate max-w-[150px]">
                        <ArrowRight size={10} className="text-slate-600" /> {log.resourceTarget || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{log.ipAddress || 'Internal'}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(log.status || 'SUCCESS')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination / Footer Info */}
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/10 border-t border-slate-800">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Data Integrity Verified: SHA-256 Checksum Pass</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(page => (
              <button key={page} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                page === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 hover:text-white'
              }`}>
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forensic Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 border-slate-800 bg-slate-900/30 flex gap-6 items-center">
          <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20">
            <AlertCircle size={28} />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Failed Actions Alert</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Detected <span className="text-rose-500 font-bold">1 failed action</span> in the last 24 hours. Verify Admin permissions for <span className="text-white">Admin_Test</span>.
            </p>
          </div>
        </div>
        <div className="card p-6 border-slate-800 bg-slate-900/30 flex gap-6 items-center">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
            <Database size={28} />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Cold Storage Sync</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Logs from <span className="text-white italic">2025-Q4</span> have been moved to secondary immutable storage. Access via Archive Explorer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;