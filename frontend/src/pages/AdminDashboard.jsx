import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { statsAPI, systemAPI, settingsAPI, usersAPI } from '../services/api';
import {
  FileText,
  AlertTriangle,
  Bell,
  Activity,
  TrendingUp,
  Clock,
  Shield,
  Users,
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  Play,
  Server,
  Cpu,
  HardDrive,
  Network,
  ArrowRight,
  FileBarChart,
  Settings,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#00ff88', '#ff3366', '#ffaa00', '#00aaff', '#9933ff', '#ff66aa'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [logsByLevel, setLogsByLevel] = useState([]);
  const [logsByTime, setLogsByTime] = useState([]);
  const [anomaliesByType, setAnomaliesByType] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const { socket } = useSocket();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        logsByLevelRes,
        logsByTimeRes,
        anomaliesByTypeRes,
        metricsRes,
        usersRes
      ] = await Promise.all([
        statsAPI.getDashboard(),
        statsAPI.getLogsByLevel(),
        statsAPI.getLogsByTime({ limit: 24 }),
        statsAPI.getAnomaliesByType(),
        systemAPI.getMetrics(),
        usersAPI.getAll()
      ]);

      setStats(statsRes.data.data);
      setLogsByLevel(logsByLevelRes.data.data);
      setLogsByTime(logsByTimeRes.data.data);
      setAnomaliesByType(anomaliesByTypeRes.data.data);
      setMetrics(metricsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = () => fetchDashboardData();
    const handleNewAnomaly = () => fetchDashboardData();
    const handleNewAlert = () => fetchDashboardData();

    socket.on('log:new', handleNewLog);
    socket.on('anomaly:detected', handleNewAnomaly);
    socket.on('alert:new', handleNewAlert);

    return () => {
      socket.off('log:new', handleNewLog);
      socket.off('anomaly:detected', handleNewAnomaly);
      socket.off('alert:new', handleNewAlert);
    };
  }, [socket, fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleGenerateDemo = async () => {
    try {
      const response = await settingsAPI.generateDemo({
        logsCount: 100,
        anomaliesCount: 20,
        alertsCount: 10
      });
      toast.success(`Generated demo data successfully`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to generate demo data');
    }
  };

  const handleClearDemo = async () => {
    try {
      await settingsAPI.clearDemo();
      toast.success('Demo data cleared');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to clear demo data');
    }
  };

  const handleBackup = async () => {
    try {
      const response = await settingsAPI.backup();
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-backup-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Settings backed up successfully');
    } catch (error) {
      toast.error('Failed to backup settings');
    }
  };

  const handleDownloadReport = async (format = 'json') => {
    try {
      toast.loading('Generating report...', { id: 'report' });
      const response = await statsAPI.generateReport(format);
      
      let blob, filename;
      if (format === 'csv') {
        blob = new Blob([response.data], { type: 'text/csv' });
        filename = `system-report-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
        filename = `system-report-${new Date().toISOString().split('T')[0]}.json`;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully', { id: 'report' });
    } catch (error) {
      toast.error('Failed to generate report', { id: 'report' });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create(newUser);
      toast.success('User created successfully');
      setShowUserModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(userId);
      toast.success('User deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole);
      toast.success('Role updated successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update role');
    }
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

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyber-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-gray-400">System overview and administration</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-outline flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Logs</p>
              <p className="text-2xl font-bold text-white">{stats?.totalLogs?.toLocaleString() || 0}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-accent/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-cyber-accent" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Anomalies</p>
              <p className="text-2xl font-bold text-white">{stats?.unresolvedAnomalies || 0}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-danger/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-cyber-danger" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Alerts</p>
              <p className="text-2xl font-bold text-white">{stats?.activeAlerts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-warning/10 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-cyber-warning" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-cyber-info/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-cyber-info" />
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyber-accent" />
              <span className="text-gray-400 text-sm">CPU</span>
            </div>
            <span className={`text-sm font-medium ${metrics?.cpu?.usage > 80 ? 'text-cyber-danger' : 'text-cyber-success'}`}>
              {metrics?.cpu?.usage?.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-cyber-border rounded-full h-2">
            <div 
              className="bg-cyber-accent h-2 rounded-full" 
              style={{ width: `${metrics?.cpu?.usage || 0}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyber-info" />
              <span className="text-gray-400 text-sm">Memory</span>
            </div>
            <span className={`text-sm font-medium ${metrics?.memory?.usagePercent > 80 ? 'text-cyber-danger' : 'text-cyber-success'}`}>
              {metrics?.memory?.usagePercent?.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-cyber-border rounded-full h-2">
            <div 
              className="bg-cyber-info h-2 rounded-full" 
              style={{ width: `${metrics?.memory?.usagePercent || 0}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cyber-warning" />
              <span className="text-gray-400 text-sm">Disk</span>
            </div>
            <span className="text-sm font-medium text-cyber-success">65%</span>
          </div>
          <div className="w-full bg-cyber-border rounded-full h-2">
            <div className="bg-cyber-warning h-2 rounded-full" style={{ width: '65%' }} />
          </div>
        </div>

        {/* Uptime */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyber-accent" />
              <span className="text-gray-400 text-sm">Uptime</span>
            </div>
            <span className="text-sm font-medium text-white">
              {metrics?.system?.uptime ? Math.floor(metrics.system.uptime / 3600) + 'h' : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs Over Time */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Logs Over Time (24h)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={logsByTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="_id" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937' }} />
              <Line type="monotone" dataKey="count" stroke="#00ff88" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Logs by Severity */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Logs by Severity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={logsByLevel}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="count"
                nameKey="_id"
              >
                {logsByLevel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Management Section */}
      <div className="card">
        <div className="p-4 border-b border-cyber-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">User Management</h3>
          <button
            onClick={() => setShowUserModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="text-left p-4 text-gray-400 font-medium">Username</th>
                <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-cyber-border hover:bg-cyber-border/30">
                  <td className="p-4 text-white">{u.username}</td>
                  <td className="p-4 text-gray-400">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                      className="select text-sm"
                      disabled={u._id === user._id}
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    {u._id !== user._id && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="text-cyber-danger hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo Data & Backup Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demo Data Controls */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Demo Data Controls</h3>
          <p className="text-gray-400 mb-4">Generate or clear demo data for testing</p>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateDemo}
              className="btn btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Generate Demo
            </button>
            <button
              onClick={handleClearDemo}
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Demo
            </button>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Settings Backup</h3>
          <p className="text-gray-400 mb-4">Export or restore system settings</p>
          <div className="flex gap-3">
            <button
              onClick={handleBackup}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Backup
            </button>
          </div>
        </div>
      </div>

      {/* Report Generation Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Report</h3>
        <p className="text-gray-400 mb-4">Generate and download comprehensive system reports</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDownloadReport('json')}
            className="btn btn-primary flex items-center gap-2"
          >
            <FileBarChart className="w-4 h-4" />
            Download JSON Report
          </button>
          <button
            onClick={() => handleDownloadReport('csv')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FileBarChart className="w-4 h-4" />
            Download CSV Report
          </button>
        </div>
      </div>

      {/* Page Navigation Panel */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Navigation</h3>
        <p className="text-gray-400 mb-4">Access all system pages</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/logs"
            className="flex items-center justify-between p-4 bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyber-accent" />
              <span className="text-white font-medium">Logs</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/anomalies"
            className="flex items-center justify-between p-4 bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-cyber-danger" />
              <span className="text-white font-medium">Anomalies</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/alerts"
            className="flex items-center justify-between p-4 bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-cyber-warning" />
              <span className="text-white font-medium">Alerts</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/settings"
            className="flex items-center justify-between p-4 bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-cyber-info" />
              <span className="text-white font-medium">Settings</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center justify-between p-4 bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyber-accent" />
              <span className="text-white font-medium">Dashboard</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/user"
            className="flex items-center justify-between p-4 bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-cyber-info" />
              <span className="text-white font-medium">DevOps Panel</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/viewer"
            className="flex items-center justify-between p-4 bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-cyber-warning" />
              <span className="text-white font-medium">Viewer Panel</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin"
            className="flex items-center justify-between p-4 bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyber-danger" />
              <span className="text-white font-medium">Admin Panel</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>

      {/* User Create Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cyber-card border border-cyber-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

