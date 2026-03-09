import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { logsAPI } from '../services/api';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Download,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    severity: '',
    component: '',
    classification: '',
    isAnomaly: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const { socket } = useSocket();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await logsAPI.getAll(params);
      setLogs(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (log) => {
      setLogs(prev => [log, ...prev.slice(0, pagination.limit - 1)]);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    };

    socket.on('log:new', handleNewLog);

    return () => {
      socket.off('log:new', handleNewLog);
    };
  }, [socket, pagination.limit]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      severity: '',
      component: '',
      classification: '',
      isAnomaly: '',
      search: ''
    });
  };

  const getSeverityClass = (severity) => {
    const classes = {
      FATAL: 'log-fatal',
      ERROR: 'log-error',
      WARNING: 'log-warning',
      INFO: 'log-info',
      DEBUG: 'log-debug',
      TRACE: 'log-trace'
    };
    return classes[severity] || 'text-gray-400';
  };

  const getClassificationBadge = (classification) => {
    const badges = {
      normal: 'badge-info',
      slow_query: 'badge-warning',
      auth_failure: 'badge-high',
      unauthorized_access: 'badge-critical',
      replication_error: 'badge-medium',
      connection_spike: 'badge-high',
      memory_issue: 'badge-medium',
      disk_issue: 'badge-medium'
    };
    return badges[classification] || 'badge-info';
  };

  const severityOptions = ['FATAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];
  const classificationOptions = [
    'normal', 'slow_query', 'auth_failure', 'unauthorized_access',
    'replication_error', 'connection_spike', 'memory_issue', 'disk_issue'
  ];
  const componentOptions = [
    'NETWORK', 'STORAGE', 'REPL', 'SHARDING', 'COMMAND', 'QUERY', 'WRITE', 'ACCESS'
  ];

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search logs..."
                className="input pl-10"
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} flex items-center gap-2`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {/* Refresh */}
          <button
            onClick={fetchLogs}
            className="btn btn-outline flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-cyber-border grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="select"
              >
                <option value="">All</option>
                {severityOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Component</label>
              <select
                value={filters.component}
                onChange={(e) => handleFilterChange('component', e.target.value)}
                className="select"
              >
                <option value="">All</option>
                {componentOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Classification</label>
              <select
                value={filters.classification}
                onChange={(e) => handleFilterChange('classification', e.target.value)}
                className="select"
              >
                <option value="">All</option>
                {classificationOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Anomaly</label>
              <select
                value={filters.isAnomaly}
                onChange={(e) => handleFilterChange('isAnomaly', e.target.value)}
                className="select"
              >
                <option value="">All</option>
                <option value="true">Anomalies Only</option>
                <option value="false">Normal Only</option>
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-white">
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} logs
        </span>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Component</th>
                <th>Message</th>
                <th>Classification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 text-cyber-accent mx-auto animate-spin" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className={log.isAnomaly ? 'bg-cyber-danger/5' : ''}>
                    <td className="whitespace-nowrap">
                      <span className="text-gray-400 font-mono text-xs">
                        {log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss') : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`font-medium ${getSeverityClass(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-300">{log.component}</span>
                    </td>
                    <td className="max-w-md">
                      <p className="truncate text-gray-300" title={log.message}>
                        {log.message}
                      </p>
                    </td>
                    <td>
                      <span className={`badge ${getClassificationBadge(log.classification)}`}>
                        {log.classification?.replace(/_/g, ' ') || 'unknown'}
                      </span>
                      {log.isAnomaly && (
                        <AlertTriangle className="w-4 h-4 text-cyber-danger ml-2 inline" />
                      )}
                    </td>
                    <td>
                      <button
                        className="text-gray-400 hover:text-white text-xs"
                        title="View details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Rows per page:</span>
          <select
            value={pagination.limit}
            onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
            className="select w-20"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="btn btn-outline p-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.pages}
            className="btn btn-outline p-2 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logs;

