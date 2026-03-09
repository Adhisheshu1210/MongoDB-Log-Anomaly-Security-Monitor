import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { alertsAPI } from '../services/api';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Bell,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [statusCounts, setStatusCounts] = useState({});
  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const { socket } = useSocket();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await alertsAPI.getAll(params);
      setAlerts(response.data.data);
      setStatusCounts(response.data.statusCounts || {});
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, pagination.limit - 1)]);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    };

    const handleAcknowledged = (alert) => {
      setAlerts(prev => prev.map(a => 
        a._id === alert._id ? alert : a
      ));
    };

    const handleResolved = (alert) => {
      setAlerts(prev => prev.map(a => 
        a._id === alert._id ? alert : a
      ));
    };

    socket.on('alert:new', handleNewAlert);
    socket.on('alert:acknowledged', handleAcknowledged);
    socket.on('alert:resolved', handleResolved);

    return () => {
      socket.off('alert:new', handleNewAlert);
      socket.off('alert:acknowledged', handleAcknowledged);
      socket.off('alert:resolved', handleResolved);
    };
  }, [socket, pagination.limit]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAcknowledge = async (id) => {
    try {
      await alertsAPI.acknowledge(id);
      toast.success('Alert acknowledged');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertsAPI.resolve(id);
      toast.success('Alert resolved');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const clearFilters = () => {
    setFilters({
      severity: '',
      category: '',
      status: ''
    });
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: 'badge-critical',
      high: 'badge-high',
      medium: 'badge-medium',
      low: 'badge-low',
      info: 'badge-info'
    };
    return badges[severity] || 'badge-info';
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: 'badge-critical',
      acknowledged: 'badge-medium',
      investigating: 'badge-warning',
      resolved: 'badge-info',
      dismissed: 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  const severityOptions = ['critical', 'high', 'medium', 'low', 'info'];
  const categoryOptions = [
    'security', 'performance', 'capacity', 'replication', 
    'connection', 'query', 'resource', 'system', 'unknown'
  ];
  const statusOptions = ['new', 'acknowledged', 'investigating', 'resolved', 'dismissed'];

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {['new', 'acknowledged', 'investigating', 'resolved', 'dismissed'].map(status => (
          <button
            key={status}
            onClick={() => handleFilterChange('status', filters.status === status ? '' : status)}
            className={`card p-3 text-center transition-all ${
              filters.status === status ? 'border-cyber-accent' : ''
            }`}
          >
            <p className="text-2xl font-bold text-white">{statusCounts[status] || 0}</p>
            <p className="text-xs text-gray-400 capitalize">{status}</p>
          </button>
        ))}
      </div>

      {/* Header Controls */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
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
            onClick={fetchAlerts}
            className="btn btn-outline flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-cyber-border grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="select"
              >
                <option value="">All</option>
                {categoryOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="select"
              >
                <option value="">All</option>
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end">
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
          Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} alerts
        </span>
      </div>

      {/* Alerts Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Category</th>
                <th>Title</th>
                <th>Status</th>
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
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No alerts found
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert._id}>
                    <td className="whitespace-nowrap">
                      <span className="text-gray-400 font-mono text-xs">
                        {alert.createdAt ? format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm:ss') : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-300 capitalize">
                        {alert.category?.replace(/_/g, ' ') || 'unknown'}
                      </span>
                    </td>
                    <td className="max-w-md">
                      <div>
                        <p className="truncate text-gray-300" title={alert.title}>
                          {alert.title}
                        </p>
                        <p className="truncate text-xs text-gray-500" title={alert.message}>
                          {alert.message}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {alert.status === 'new' && (
                          <button
                            onClick={() => handleAcknowledge(alert._id)}
                            className="text-cyber-warning hover:text-cyber-warning/80"
                            title="Acknowledge"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {alert.status !== 'resolved' && alert.status !== 'dismissed' && (
                          <button
                            onClick={() => handleResolve(alert._id)}
                            className="text-cyber-success hover:text-cyber-success/80"
                            title="Resolve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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

export default Alerts;

