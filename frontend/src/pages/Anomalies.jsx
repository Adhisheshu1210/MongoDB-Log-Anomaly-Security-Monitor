import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { anomaliesAPI } from '../services/api';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Anomalies = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    isResolved: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const { socket } = useSocket();

  const fetchAnomalies = useCallback(async () => {
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

      const response = await anomaliesAPI.getAll(params);
      setAnomalies(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      toast.error('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  useEffect(() => {
    if (!socket) return;

    const handleNewAnomaly = (anomaly) => {
      setAnomalies(prev => [anomaly, ...prev.slice(0, pagination.limit - 1)]);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    };

    const handleResolved = (anomaly) => {
      setAnomalies(prev => prev.map(a => 
        a._id === anomaly._id ? anomaly : a
      ));
    };

    socket.on('anomaly:detected', handleNewAnomaly);
    socket.on('anomaly:resolved', handleResolved);

    return () => {
      socket.off('anomaly:detected', handleNewAnomaly);
      socket.off('anomaly:resolved', handleResolved);
    };
  }, [socket, pagination.limit]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResolve = async (id) => {
    try {
      await anomaliesAPI.resolve(id);
      toast.success('Anomaly resolved');
      fetchAnomalies();
    } catch (error) {
      toast.error('Failed to resolve anomaly');
    }
  };

  const clearFilters = () => {
    setFilters({
      severity: '',
      type: '',
      isResolved: ''
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

  const getTypeLabel = (type) => {
    return type?.replace(/_/g, ' ') || 'unknown';
  };

  const severityOptions = ['critical', 'high', 'medium', 'low', 'info'];
  const typeOptions = [
    'security', 'performance', 'capacity', 'replication', 
    'connection', 'query', 'resource', 'unknown'
  ];

  return (
    <div className="space-y-4">
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
            onClick={fetchAnomalies}
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
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="select"
              >
                <option value="">All</option>
                {typeOptions.map(opt => (
                  <option key={opt} value={opt}>{getTypeLabel(opt)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={filters.isResolved}
                onChange={(e) => handleFilterChange('isResolved', e.target.value)}
                className="select"
              >
                <option value="">All</option>
                <option value="false">Unresolved</option>
                <option value="true">Resolved</option>
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
          Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} anomalies
        </span>
      </div>

      {/* Anomalies Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Type</th>
                <th>Title</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 text-cyber-accent mx-auto animate-spin" />
                  </td>
                </tr>
              ) : anomalies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No anomalies found
                  </td>
                </tr>
              ) : (
                anomalies.map((anomaly) => (
                  <tr key={anomaly._id} className={!anomaly.isResolved ? 'bg-cyber-danger/5' : ''}>
                    <td className="whitespace-nowrap">
                      <span className="text-gray-400 font-mono text-xs">
                        {anomaly.timestamp ? format(new Date(anomaly.timestamp), 'yyyy-MM-dd HH:mm:ss') : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getSeverityBadge(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-300 capitalize">
                        {getTypeLabel(anomaly.type)}
                      </span>
                    </td>
                    <td className="max-w-md">
                      <p className="truncate text-gray-300" title={anomaly.title}>
                        {anomaly.title}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-cyber-border rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyber-danger rounded-full"
                            style={{ width: `${anomaly.anomalyScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {(anomaly.anomalyScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {anomaly.isResolved ? (
                        <span className="flex items-center gap-1 text-cyber-success text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Resolved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-cyber-danger text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-gray-400 hover:text-white"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!anomaly.isResolved && (
                          <button
                            onClick={() => handleResolve(anomaly._id)}
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

export default Anomalies;

