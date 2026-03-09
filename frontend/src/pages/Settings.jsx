import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../services/api';
import {
  Bell,
  Shield,
  Zap,
  Save,
  RefreshCw,
  Mail,
  MessageSquare,
  Send,
  Database,
  Download,
  Upload,
  Trash2,
  Play,
  Lock,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    alertThresholds: {
      slowQueryMs: 100,
      connectionSpikeThreshold: 100,
      errorRateThreshold: 10,
      memoryUsagePercent: 85,
      diskUsagePercent: 90,
      replicationLagSeconds: 10
    },
    notificationSettings: {
      email: { enabled: false, recipients: [] },
      slack: { enabled: false, webhookUrl: '' },
      telegram: { enabled: false, botToken: '', chatId: '' }
    },
    anomalyDetection: {
      enabled: true,
      algorithm: 'isolation_forest',
      contamination: 0.1,
      n_estimators: 100
    }
  });
  const [activeTab, setActiveTab] = useState('alerts');

  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAll();
      const settingsData = response.data.data;
      
      // Convert array to object
      const settingsObj = {};
      settingsData.forEach(s => {
        settingsObj[s.key] = s.value;
      });
      
      if (settingsObj.alertThresholds) setSettings(prev => ({ ...prev, alertThresholds: settingsObj.alertThresholds }));
      if (settingsObj.notificationSettings) setSettings(prev => ({ ...prev, notificationSettings: settingsObj.notificationSettings }));
      if (settingsObj.anomalyDetection) setSettings(prev => ({ ...prev, anomalyDetection: settingsObj.anomalyDetection }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to save settings');
      return;
    }
    try {
      setSaving(true);
      
      await settingsAPI.update('alertThresholds', {
        value: settings.alertThresholds
      });
      
      await settingsAPI.update('notificationSettings', {
        value: settings.notificationSettings
      });
      
      await settingsAPI.update('anomalyDetection', {
        value: settings.anomalyDetection
      });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'alerts', label: 'Alert Thresholds', icon: Bell },
    { id: 'notifications', label: 'Notifications', icon: MessageSquare },
    { id: 'anomaly', label: 'Anomaly Detection', icon: Zap },
    ...(isAdmin ? [{ id: 'demo', label: 'Demo Data', icon: Database }] : []),
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const handleGenerateDemo = async () => {
    if (!isAdmin) {
      toast.error('Only admins can generate demo data');
      return;
    }
    try {
      setSaving(true);
      const response = await settingsAPI.generateDemo({
        logsCount: 100,
        anomaliesCount: 20,
        alertsCount: 10
      });
      toast.success(`Generated demo data: ${response.data.data.logsGenerated} logs, ${response.data.data.anomaliesGenerated} anomalies, ${response.data.data.alertsGenerated} alerts`);
    } catch (error) {
      console.error('Error generating demo data:', error);
      toast.error('Failed to generate demo data');
    } finally {
      setSaving(false);
    }
  };

  const handleClearDemo = async () => {
    if (!isAdmin) {
      toast.error('Only admins can clear demo data');
      return;
    }
    try {
      setSaving(true);
      const response = await settingsAPI.clearDemo();
      toast.success(`Cleared demo data: ${response.data.data.logsDeleted} logs, ${response.data.data.anomaliesDeleted} anomalies, ${response.data.data.alertsDeleted} alerts`);
    } catch (error) {
      console.error('Error clearing demo data:', error);
      toast.error('Failed to clear demo data');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    if (!isAdmin) {
      toast.error('Only admins can backup settings');
      return;
    }
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
      console.error('Error backing up settings:', error);
      toast.error('Failed to backup settings');
    }
  };

  const handleRestore = async (e) => {
    if (!isAdmin) {
      toast.error('Only admins can restore settings');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await settingsAPI.restore(backup);
      toast.success('Settings restored successfully');
      fetchSettings();
    } catch (error) {
      console.error('Error restoring settings:', error);
      toast.error('Failed to restore settings - invalid backup file');
    }
  };

  if (loading) {
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
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-gray-400">Configure your monitoring preferences</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        )}
      </div>

      {/* Viewer Notice */}
      {isViewer && (
        <div className="card p-4 bg-cyber-warning/5 border-cyber-warning/20">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-cyber-warning" />
            <div>
              <p className="text-white font-medium">Read-Only Access</p>
              <p className="text-sm text-gray-400">
                You have view-only access to settings. Contact an administrator to modify any settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Non-Admin Notice */}
      {!isAdmin && !isViewer && (
        <div className="card p-4 bg-cyber-info/5 border-cyber-info/20">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-cyber-info" />
            <div>
              <p className="text-white font-medium">Limited Access</p>
              <p className="text-sm text-gray-400">
                You can view settings but cannot modify them. Only administrators can change configuration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cyber-border pb-2 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyber-accent/10 text-cyber-accent'
                  : 'text-gray-400 hover:text-white hover:bg-cyber-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="card p-6">
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Alert Thresholds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Slow Query Threshold (ms)
                </label>
                <input
                  type="number"
                  value={settings.alertThresholds.slowQueryMs}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    alertThresholds: { ...prev.alertThresholds, slowQueryMs: parseInt(e.target.value) }
                  }))}
                  className="input"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when query takes longer than this duration
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Connection Spike Threshold
                </label>
                <input
                  type="number"
                  value={settings.alertThresholds.connectionSpikeThreshold}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    alertThresholds: { ...prev.alertThresholds, connectionSpikeThreshold: parseInt(e.target.value) }
                  }))}
                  className="input"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when connections exceed this number
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Error Rate Threshold (per minute)
                </label>
                <input
                  type="number"
                  value={settings.alertThresholds.errorRateThreshold}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    alertThresholds: { ...prev.alertThresholds, errorRateThreshold: parseInt(e.target.value) }
                  }))}
                  className="input"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when error rate exceeds this value
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Memory Usage Threshold (%)
                </label>
                <input
                  type="number"
                  value={settings.alertThresholds.memoryUsagePercent}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    alertThresholds: { ...prev.alertThresholds, memoryUsagePercent: parseInt(e.target.value) }
                  }))}
                  className="input"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when memory usage exceeds this percentage
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Disk Usage Threshold (%)
                </label>
                <input
                  type="number"
                  value={settings.alertThresholds.diskUsagePercent}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    alertThresholds: { ...prev.alertThresholds, diskUsagePercent: parseInt(e.target.value) }
                  }))}
                  className="input"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when disk usage exceeds this percentage
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Replication Lag Threshold (seconds)
                </label>
                <input
                  type="number"
                  value={settings.alertThresholds.replicationLagSeconds}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    alertThresholds: { ...prev.alertThresholds, replicationLagSeconds: parseInt(e.target.value) }
                  }))}
                  className="input"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when replication lag exceeds this value
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Notification Channels</h3>
            
            {/* Email Notifications */}
            <div className="p-4 bg-cyber-darker rounded-lg border border-cyber-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-white font-medium">Email Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificationSettings.email.enabled}
                    onChange={(e) => isAdmin && setSettings(prev => ({
                      ...prev,
                      notificationSettings: {
                        ...prev.notificationSettings,
                        email: { ...prev.notificationSettings.email, enabled: e.target.checked }
                      }
                    }))}
                    className="sr-only peer"
                    disabled={!isAdmin}
                  />
                  <div className={`w-11 h-6 bg-cyber-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-accent ${!isAdmin ? 'opacity-50' : ''}`}></div>
                </label>
              </div>
              {settings.notificationSettings.email.enabled && isAdmin && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="SMTP Host"
                    value={settings.notificationSettings.email.smtpHost || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: {
                        ...prev.notificationSettings,
                        email: { ...prev.notificationSettings.email, smtpHost: e.target.value }
                      }
                    }))}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Recipients (comma separated)"
                    value={settings.notificationSettings.email.recipients?.join(', ') || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: {
                        ...prev.notificationSettings,
                        email: { 
                          ...prev.notificationSettings.email, 
                          recipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                        }
                      }
                    }))}
                    className="input"
                  />
                </div>
              )}
            </div>

            {/* Slack Notifications */}
            <div className="p-4 bg-cyber-darker rounded-lg border border-cyber-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-gray-400" />
                  <span className="text-white font-medium">Slack Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificationSettings.slack.enabled}
                    onChange={(e) => isAdmin && setSettings(prev => ({
                      ...prev,
                      notificationSettings: {
                        ...prev.notificationSettings,
                        slack: { ...prev.notificationSettings.slack, enabled: e.target.checked }
                      }
                    }))}
                    className="sr-only peer"
                    disabled={!isAdmin}
                  />
                  <div className={`w-11 h-6 bg-cyber-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-accent ${!isAdmin ? 'opacity-50' : ''}`}></div>
                </label>
              </div>
              {settings.notificationSettings.slack.enabled && isAdmin && (
                <input
                  type="text"
                  placeholder="Slack Webhook URL"
                  value={settings.notificationSettings.slack.webhookUrl || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notificationSettings: {
                      ...prev.notificationSettings,
                      slack: { ...prev.notificationSettings.slack, webhookUrl: e.target.value }
                    }
                  }))}
                  className="input"
                />
              )}
            </div>

            {/* Telegram Notifications */}
            <div className="p-4 bg-cyber-darker rounded-lg border border-cyber-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span className="text-white font-medium">Telegram Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificationSettings.telegram.enabled}
                    onChange={(e) => isAdmin && setSettings(prev => ({
                      ...prev,
                      notificationSettings: {
                        ...prev.notificationSettings,
                        telegram: { ...prev.notificationSettings.telegram, enabled: e.target.checked }
                      }
                    }))}
                    className="sr-only peer"
                    disabled={!isAdmin}
                  />
                  <div className={`w-11 h-6 bg-cyber-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-accent ${!isAdmin ? 'opacity-50' : ''}`}></div>
                </label>
              </div>
              {settings.notificationSettings.telegram.enabled && isAdmin && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Bot Token"
                    value={settings.notificationSettings.telegram.botToken || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: {
                        ...prev.notificationSettings,
                        telegram: { ...prev.notificationSettings.telegram, botToken: e.target.value }
                      }
                    }))}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Chat ID"
                    value={settings.notificationSettings.telegram.chatId || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: {
                        ...prev.notificationSettings,
                        telegram: { ...prev.notificationSettings.telegram, chatId: e.target.value }
                      }
                    }))}
                    className="input"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'anomaly' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Anomaly Detection Settings</h3>
            
            <div className="flex items-center justify-between p-4 bg-cyber-darker rounded-lg border border-cyber-border">
              <div>
                <span className="text-white font-medium">Enable Anomaly Detection</span>
                <p className="text-xs text-gray-500 mt-1">Process logs for anomaly detection</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.anomalyDetection.enabled}
                  onChange={(e) => isAdmin && setSettings(prev => ({
                    ...prev,
                    anomalyDetection: { ...prev.anomalyDetection, enabled: e.target.checked }
                  }))}
                  className="sr-only peer"
                  disabled={!isAdmin}
                />
                <div className={`w-11 h-6 bg-cyber-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-accent ${!isAdmin ? 'opacity-50' : ''}`}></div>
              </label>
            </div>

            {settings.anomalyDetection.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Algorithm</label>
                  <select
                    value={settings.anomalyDetection.algorithm}
                    onChange={(e) => isAdmin && setSettings(prev => ({
                      ...prev,
                      anomalyDetection: { ...prev.anomalyDetection, algorithm: e.target.value }
                    }))}
                    className="select"
                    disabled={!isAdmin}
                  >
                    <option value="isolation_forest">Isolation Forest</option>
                    <option value="lof">Local Outlier Factor</option>
                    <option value="autoencoder">Autoencoder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Contamination</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.anomalyDetection.contamination}
                    onChange={(e) => isAdmin && setSettings(prev => ({
                      ...prev,
                      anomalyDetection: { ...prev.anomalyDetection, contamination: parseFloat(e.target.value) }
                    }))}
                    className="input"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">Expected proportion of anomalies (0-1)</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Number of Estimators</label>
                  <input
                    type="number"
                    value={settings.anomalyDetection.n_estimators}
                    onChange={(e) => isAdmin && setSettings(prev => ({
                      ...prev,
                      anomalyDetection: { ...prev.anomalyDetection, n_estimators: parseInt(e.target.value) }
                    }))}
                    className="input"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of trees in the forest</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'demo' && isAdmin && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Demo Data Management</h3>
            <p className="text-gray-400">Generate sample data for testing and demonstration purposes</p>
            
            {/* Generate Demo Data */}
            <div className="p-4 bg-cyber-darker rounded-lg border border-cyber-border">
              <div className="flex items-center gap-3 mb-4">
                <Play className="w-5 h-5 text-cyber-accent" />
                <span className="text-white font-medium">Generate Demo Data</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Create sample logs, anomalies, and alerts for testing the dashboard functionality.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateDemo}
                  disabled={saving}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Generate Demo Data
                </button>
              </div>
            </div>

            {/* Clear Demo Data */}
            <div className="p-4 bg-cyber-darker rounded-lg border border-cyber-border">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="text-white font-medium">Clear Demo Data</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Remove all demo-generated data from the system.
              </p>
              <button
                onClick={handleClearDemo}
                disabled={saving}
                className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Demo Data
              </button>
            </div>

            {/* Backup/Restore Settings */}
            <div className="p-4 bg-cyber-darker rounded-lg border border-cyber-border">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-cyber-accent" />
                <span className="text-white font-medium">Settings Backup & Restore</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Export your settings to a JSON file or restore from a backup.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleBackup}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Backup Settings
                </button>
                <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Restore Settings
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Security Settings</h3>
            <div className="p-4 bg-cyber-darker rounded-lg border border-cyber-border">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-cyber-accent" />
                <span className="text-white">Your Account</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Username</p>
                  <p className="text-white font-medium">{user?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Role</p>
                  <p className="text-white font-medium capitalize">{user?.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Account Status</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyber-success/20 text-cyber-success">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

