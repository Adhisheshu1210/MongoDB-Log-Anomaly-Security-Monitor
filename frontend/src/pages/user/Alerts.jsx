import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
  Eye,
  Settings2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useSocket } from '../../context/SocketContext';
import { alertsAPI } from '../../services/api';
import useRBAC from '../../hooks/useRBAC';

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const STATUS_OPTIONS = ['all', 'new', 'acknowledged', 'investigating', 'resolved'];

const Alerts = () => {
  const { socket } = useSocket();
  const { can } = useRBAC();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 10 });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        status: activeFilter !== 'all' ? activeFilter : undefined,
        search: searchQuery || undefined
      };
      const response = await alertsAPI.getAlerts(params);
      setAlerts(response.data.alerts);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (err) {
      toast.error('Failed to sync alert database');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, activeFilter, searchQuery]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (socket) {
      socket.on('alert:new', (newAlert) => {
        setAlerts(prev => [newAlert, ...prev].slice(0, 10));
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 border-l-4 border-red-500 shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
            <div className="flex-1 w-0">
              <p className="text-sm font-bold text-white uppercase tracking-tighter">New Security Alert</p>
              <p className="mt-1 text-xs text-slate-400">{newAlert.message}</p>
            </div>
          </div>
        ));
      });
      return () => socket.off('alert:new');
    }
  }, [socket]);

  const updateStatus = async (id, status) => {
    if (status === 'acknowledged' && !can('acknowledge_alerts')) {
      toast.error('Your role cannot acknowledge alerts');
      return;
    }
    if (status === 'resolved' && !can('resolve_alerts')) {
      toast.error('Your role cannot resolve alerts');
      return;
    }

    try {
      await alertsAPI.updateStatus(id, status);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      toast.success(`Alert marked as ${status}`);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'critical': return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
      case 'high': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      case 'medium': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
      default: return 'text-cyan-500 border-cyan-500/20 bg-cyan-500/10';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Bell className="text-indigo-500" /> Alert Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time incident response and security event triaging.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by ID or Message..." 
              className="bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={fetchAlerts} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto no-scrollbar">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all relative ${
              activeFilter === status ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {status}
            {activeFilter === status && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {loading && alerts.length === 0 ? (
          <div className="py-20 text-center text-slate-600 font-mono text-xs animate-pulse">Scanning Kafka Buffer...</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {alerts.map((alert) => (
              <motion.div
                key={alert._id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="group relative bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 hover:border-slate-700 hover:bg-slate-900/50 transition-all backdrop-blur-sm"
              >
                {/* Severity Badge */}
                <div className={`shrink-0 w-24 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase text-center ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-indigo-400 font-bold">{alert._id.slice(-8).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{format(new Date(alert.createdAt), 'MMM dd, HH:mm:ss')}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium line-clamp-1">{alert.message}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('acknowledge_alerts') && (
                    <button 
                      onClick={() => updateStatus(alert._id, 'acknowledged')}
                      className="p-2 bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                      title="Acknowledge"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-2 bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all">
                    <Eye className="w-4 h-4" />
                  </button>
                  {can('manage_security') && (
                    <button className="p-2 bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="text-white">{alerts.length}</span> of <span className="text-white">{pagination.total}</span> events
        </p>
        <div className="flex gap-2">
          <button 
            disabled={pagination.page === 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-30 text-slate-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            disabled={alerts.length < pagination.limit}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-30 text-slate-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alerts;