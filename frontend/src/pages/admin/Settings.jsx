import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Bell, 
  Shield, 
  Key, 
  Database, 
  Save, 
  RefreshCcw,
  Cpu,
  Lock,
  Mail,
  AlertTriangle,
  Check,
  Loader2,
  Copy,
  Trash2,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import useRBAC from '../../hooks/useRBAC';
import settingsService from '../../services/settings.service';

const Settings = () => {
  const { can } = useRBAC();
  const canManageSettings = can('manage_settings');
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showPassword, setShowPassword] = useState({});

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    systemDisplayName: 'Sentinel SIEM Enterprise',
    primaryContactEmail: 'admin@siem.io',
    organizationName: 'Security Operations Center',
    timezone: 'UTC',
    language: 'en',
    environmentType: 'production'
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 15,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireMFA: true
  });

  // API & Webhooks State
  const [apiWebhookSettings, setApiWebhookSettings] = useState({
    apiKeysEnabled: true,
    rateLimit: 1000,
    webhooksEnabled: true,
    retryAttempts: 3,
    webhookTimeout: 30,
    ipWhitelistEnabled: false,
    ipWhitelist: []
  });
  const [apiKeys, setApiKeys] = useState([]);
  const [generatingKey, setGeneratingKey] = useState(false);

  // Storage Settings State
  const [storageSettings, setStorageSettings] = useState({
    hotStorageDays: 30,
    coldStorageDays: 365,
    maxDocuments: 1000000,
    autoArchiveEnabled: true,
    archiveLocation: 'deep-archive-cluster',
    compressionEnabled: true
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    email: { enabled: false, recipients: [], smtpHost: '', smtpPort: 587 },
    slack: { enabled: false, webhookUrl: '' },
    telegram: { enabled: false, botToken: '', chatId: '' }
  });
  const [testingNotifications, setTestingNotifications] = useState(false);

  const tabs = [
    { id: 'General', icon: Globe },
    { id: 'Security', icon: Shield },
    { id: 'API & Webhooks', icon: Key },
    { id: 'Storage', icon: Database },
    { id: 'Notifications', icon: Bell },
  ];

  // Load all settings on mount
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        setLoading(true);
        const [general, security, apiWebhook, storage, notification] = await Promise.all([
          settingsService.getGeneralSettings(),
          settingsService.getSecuritySettings(),
          settingsService.getApiWebhookSettings(),
          settingsService.getStorageSettings(),
          settingsService.getNotificationSettings()
        ]);

        if (general.data.success) setGeneralSettings(general.data.data.settings);
        if (security.data.success) setSecuritySettings(security.data.data.settings);
        if (apiWebhook.data.success) {
          setApiWebhookSettings(apiWebhook.data.data.settings);
          setApiKeys(apiWebhook.data.data.apiKeys);
        }
        if (storage.data.success) setStorageSettings(storage.data.data.settings);
        if (notification.data.success) setNotificationSettings(notification.data.data.settings);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadAllSettings();
  }, []);

  // Save current tab settings
  const handleSaveSettings = useCallback(async () => {
    if (!canManageSettings) {
      toast.error('Permission denied: manage_settings required');
      return;
    }

    try {
      setSaving(true);
      let response;

      switch (activeTab) {
        case 'General':
          response = await settingsService.updateGeneralSettings(generalSettings);
          break;
        case 'Security':
          response = await settingsService.updateSecuritySettings(securitySettings);
          break;
        case 'API & Webhooks':
          response = await settingsService.updateApiWebhookSettings(apiWebhookSettings);
          break;
        case 'Storage':
          response = await settingsService.updateStorageSettings(storageSettings);
          break;
        case 'Notifications':
          response = await settingsService.updateNotificationSettings(notificationSettings);
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(`${activeTab} settings saved successfully`);
      } else {
        toast.error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [activeTab, generalSettings, securitySettings, apiWebhookSettings, storageSettings, notificationSettings, canManageSettings]);

  // Generate new API key
  const handleGenerateApiKey = async () => {
    if (!canManageSettings) {
      toast.error('Permission denied: manage_settings required');
      return;
    }

    try {
      setGeneratingKey(true);
      const response = await settingsService.generateApiKey();

      if (response.data.success) {
        const newKey = response.data.data.key;
        setApiKeys([...apiKeys, { keyId: newKey.substring(0, 20) + '...', fullKey: newKey, createdAt: new Date(), active: true }]);
        toast.success('API key generated successfully');
        
        // Copy to clipboard
        navigator.clipboard.writeText(newKey);
        toast.success('API key copied to clipboard');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setGeneratingKey(false);
    }
  };

  // Revoke API key
  const handleRevokeApiKey = async (keyId) => {
    if (!canManageSettings) {
      toast.error('Permission denied: manage_settings required');
      return;
    }

    try {
      const response = await settingsService.revokeApiKey(keyId);

      if (response.data.success) {
        setApiKeys(apiKeys.filter(k => k.keyId !== keyId));
        toast.success('API key revoked successfully');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  // Test notifications
  const handleTestNotifications = async () => {
    if (!canManageSettings) {
      toast.error('Permission denied: manage_settings required');
      return;
    }

    try {
      setTestingNotifications(true);
      const response = await settingsService.testNotifications();

      if (response.data.success) {
        toast.success('Test notifications sent successfully');
      }
    } catch (error) {
      console.error('Error testing notifications:', error);
      toast.error('Failed to send test notifications');
    } finally {
      setTestingNotifications(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-indigo-500" size={32} /> System Configuration
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">
            {canManageSettings ? 'Admin privileges enabled • Live database sync' : 'Read-only mode'}
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={!canManageSettings || saving}
          title={canManageSettings ? 'Save configuration changes' : 'Permission required: manage_settings'}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            canManageSettings
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          } ${saving ? 'opacity-50' : ''}`}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} /> Save Changes
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-8"
          >

            {/* GENERAL TAB */}
            {activeTab === 'General' && (
              <section className="space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">General Environment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">System Display Name</label>
                    <input 
                      type="text" 
                      value={generalSettings.systemDisplayName}
                      onChange={(e) => setGeneralSettings({...generalSettings, systemDisplayName: e.target.value})}
                      disabled={!canManageSettings}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Primary Contact Email</label>
                    <input 
                      type="email" 
                      value={generalSettings.primaryContactEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, primaryContactEmail: e.target.value})}
                      disabled={!canManageSettings}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Organization Name</label>
                    <input 
                      type="text" 
                      value={generalSettings.organizationName}
                      onChange={(e) => setGeneralSettings({...generalSettings, organizationName: e.target.value})}
                      disabled={!canManageSettings}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Timezone</label>
                    <select 
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                      disabled={!canManageSettings}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST (UTC-5)</option>
                      <option value="CST">CST (UTC-6)</option>
                      <option value="MST">MST (UTC-7)</option>
                      <option value="PST">PST (UTC-8)</option>
                      <option value="GMT">GMT (UTC+0)</option>
                      <option value="IST">IST (UTC+5:30)</option>
                      <option value="SGT">SGT (UTC+8)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Language</label>
                    <select 
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                      disabled={!canManageSettings}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Environment Type</label>
                    <select 
                      value={generalSettings.environmentType}
                      onChange={(e) => setGeneralSettings({...generalSettings, environmentType: e.target.value})}
                      disabled={!canManageSettings}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'Security' && (
              <>
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Lock size={18} className="text-indigo-400" /> Authentication Policies
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">Enforce MFA</span>
                        <button
                          onClick={() => setSecuritySettings({...securitySettings, requireMFA: !securitySettings.requireMFA})}
                          disabled={!canManageSettings}
                          className={`w-10 h-5 rounded-full relative transition-all ${securitySettings.requireMFA ? 'bg-indigo-600' : 'bg-slate-800'}`}
                        >
                          <div className={`absolute top-1 ${securitySettings.requireMFA ? 'left-6' : 'left-1'} w-3 h-3 bg-white rounded-full transition-all`} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase leading-relaxed">Require Multi-Factor Authentication for all Admin roles.</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">Session Timeout</label>
                        <input 
                          type="number" 
                          min="5" 
                          max="480"
                          value={securitySettings.sessionTimeout}
                          onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                          disabled={!canManageSettings}
                          className="w-16 bg-slate-900 text-[10px] text-indigo-400 font-bold text-center rounded px-2 py-1 outline-none border border-slate-700 disabled:opacity-50"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase leading-relaxed">Automatic log-out duration for inactive sessions (minutes).</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">Max Login Attempts</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="20"
                          value={securitySettings.maxLoginAttempts}
                          onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                          disabled={!canManageSettings}
                          className="w-16 bg-slate-900 text-[10px] text-indigo-400 font-bold text-center rounded px-2 py-1 outline-none border border-slate-700 disabled:opacity-50"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase leading-relaxed">Failed attempts before account lock.</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">Min Password Length</label>
                        <input 
                          type="number" 
                          min="6" 
                          max="20"
                          value={securitySettings.passwordMinLength}
                          onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                          disabled={!canManageSettings}
                          className="w-16 bg-slate-900 text-[10px] text-indigo-400 font-bold text-center rounded px-2 py-1 outline-none border border-slate-700 disabled:opacity-50"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase leading-relaxed">Minimum password character requirement.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Key size={18} className="text-indigo-400" /> API Access Keys
                  </h3>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div className="font-mono text-[11px] text-slate-400">
                      sk_live_••••••••••••••••4x92
                    </div>
                    <button
                      type="button"
                      disabled={!canManageSettings}
                      title={canManageSettings ? 'Rotate API key' : 'Permission required: manage_settings'}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        canManageSettings
                          ? 'text-indigo-400 hover:text-white'
                          : 'text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <RefreshCcw size={14} /> Rotate Key
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* API & WEBHOOKS TAB */}
            {activeTab === 'API & Webhooks' && (
              <>
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">API Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">Enable API Keys</span>
                        <button
                          onClick={() => setApiWebhookSettings({...apiWebhookSettings, apiKeysEnabled: !apiWebhookSettings.apiKeysEnabled})}
                          disabled={!canManageSettings}
                          className={`w-10 h-5 rounded-full relative transition-all ${apiWebhookSettings.apiKeysEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                        >
                          <div className={`absolute top-1 ${apiWebhookSettings.apiKeysEnabled ? 'left-6' : 'left-1'} w-3 h-3 bg-white rounded-full transition-all`} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">Rate Limit (req/hour)</label>
                        <input 
                          type="number" 
                          min="100" 
                          step="100"
                          value={apiWebhookSettings.rateLimit}
                          onChange={(e) => setApiWebhookSettings({...apiWebhookSettings, rateLimit: parseInt(e.target.value)})}
                          disabled={!canManageSettings}
                          className="w-24 bg-slate-900 text-[10px] text-indigo-400 font-bold text-center rounded px-2 py-1 outline-none border border-slate-700 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">Enable Webhooks</span>
                        <button
                          onClick={() => setApiWebhookSettings({...apiWebhookSettings, webhooksEnabled: !apiWebhookSettings.webhooksEnabled})}
                          disabled={!canManageSettings}
                          className={`w-10 h-5 rounded-full relative transition-all ${apiWebhookSettings.webhooksEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                        >
                          <div className={`absolute top-1 ${apiWebhookSettings.webhooksEnabled ? 'left-6' : 'left-1'} w-3 h-3 bg-white rounded-full transition-all`} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">Webhook Timeout (sec)</label>
                        <input 
                          type="number" 
                          min="5" 
                          max="300"
                          value={apiWebhookSettings.webhookTimeout}
                          onChange={(e) => setApiWebhookSettings({...apiWebhookSettings, webhookTimeout: parseInt(e.target.value)})}
                          disabled={!canManageSettings}
                          className="w-20 bg-slate-900 text-[10px] text-indigo-400 font-bold text-center rounded px-2 py-1 outline-none border border-slate-700 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">Retry Attempts</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="10"
                          value={apiWebhookSettings.retryAttempts}
                          onChange={(e) => setApiWebhookSettings({...apiWebhookSettings, retryAttempts: parseInt(e.target.value)})}
                          disabled={!canManageSettings}
                          className="w-16 bg-slate-900 text-[10px] text-indigo-400 font-bold text-center rounded px-2 py-1 outline-none border border-slate-700 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Key size={18} className="text-indigo-400" /> Active API Keys
                    </h3>
                    <button
                      onClick={handleGenerateApiKey}
                      disabled={!canManageSettings || generatingKey}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        canManageSettings
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {generatingKey ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Generate New
                        </>
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {apiKeys && apiKeys.length > 0 ? (
                      apiKeys.map((key, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-mono text-xs text-slate-400">{key.keyId}</p>
                            <p className="text-[9px] text-slate-600 mt-1">{new Date(key.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(key.fullKey, `key-${idx}`)}
                              className="p-2 hover:bg-slate-800 rounded transition-all"
                            >
                              {copied === `key-${idx}` ? (
                                <Check size={14} className="text-emerald-500" />
                              ) : (
                                <Copy size={14} className="text-slate-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRevokeApiKey(key.keyId)}
                              disabled={!canManageSettings}
                              className="p-2 hover:bg-rose-500/10 rounded transition-all disabled:opacity-50"
                            >
                              <Trash2 size={14} className="text-rose-500" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 text-xs py-4">No API keys generated yet</p>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* STORAGE TAB */}
            {activeTab === 'Storage' && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Database size={18} className="text-indigo-400" /> Log Retention Engine
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-300">Hot Storage Days (MongoDB)</span>
                        <span className="text-indigo-400">{storageSettings.hotStorageDays} days</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="365"
                        value={storageSettings.hotStorageDays}
                        onChange={(e) => setStorageSettings({...storageSettings, hotStorageDays: parseInt(e.target.value)})}
                        disabled={!canManageSettings}
                        className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-300">Cold Storage Days (Archive)</span>
                        <span className="text-indigo-400">{storageSettings.coldStorageDays} days</span>
                      </div>
                      <input 
                        type="range" 
                        min="30" 
                        max="3650"
                        value={storageSettings.coldStorageDays}
                        onChange={(e) => setStorageSettings({...storageSettings, coldStorageDays: parseInt(e.target.value)})}
                        disabled={!canManageSettings}
                        className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-300">Max Documents</span>
                        <span className="text-indigo-400">{(storageSettings.maxDocuments / 1000000).toFixed(1)}M</span>
                      </div>
                      <input 
                        type="range" 
                        min="100000" 
                        max="10000000"
                        step="100000"
                        value={storageSettings.maxDocuments}
                        onChange={(e) => setStorageSettings({...storageSettings, maxDocuments: parseInt(e.target.value)})}
                        disabled={!canManageSettings}
                        className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">Auto-Archive</span>
                        <button
                          onClick={() => setStorageSettings({...storageSettings, autoArchiveEnabled: !storageSettings.autoArchiveEnabled})}
                          disabled={!canManageSettings}
                          className={`w-10 h-5 rounded-full relative transition-all ${storageSettings.autoArchiveEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                        >
                          <div className={`absolute top-1 ${storageSettings.autoArchiveEnabled ? 'left-6' : 'left-1'} w-3 h-3 bg-white rounded-full transition-all`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-start gap-4">
                  <Cpu size={24} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Auto-Purge Strategy</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase leading-relaxed font-bold">
                      The system is configured to move logs older than {storageSettings.hotStorageDays} days to the <span className="text-indigo-400">{storageSettings.archiveLocation}</span> to optimize query performance.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'Notifications' && (
              <>
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Mail size={18} className="text-indigo-400" /> Email Notifications
                    </h3>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Enable Email Alerts</span>
                      <button
                        onClick={() => setNotificationSettings({...notificationSettings, email: {...notificationSettings.email, enabled: !notificationSettings.email.enabled}})}
                        disabled={!canManageSettings}
                        className={`w-10 h-5 rounded-full relative transition-all ${notificationSettings.email.enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-1 ${notificationSettings.email.enabled ? 'left-6' : 'left-1'} w-3 h-3 bg-white rounded-full transition-all`} />
                      </button>
                    </div>
                    {notificationSettings.email.enabled && (
                      <div className="space-y-3 pt-4 border-t border-slate-700">
                        <input 
                          type="text" 
                          placeholder="SMTP Host"
                          value={notificationSettings.email.smtpHost}
                          onChange={(e) => setNotificationSettings({...notificationSettings, email: {...notificationSettings.email, smtpHost: e.target.value}})}
                          disabled={!canManageSettings}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                        <input 
                          type="number" 
                          placeholder="SMTP Port"
                          value={notificationSettings.email.smtpPort}
                          onChange={(e) => setNotificationSettings({...notificationSettings, email: {...notificationSettings.email, smtpPort: e.target.value}})}
                          disabled={!canManageSettings}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Slack Integration</h3>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Enable Slack Alerts</span>
                      <button
                        onClick={() => setNotificationSettings({...notificationSettings, slack: {...notificationSettings.slack, enabled: !notificationSettings.slack.enabled}})}
                        disabled={!canManageSettings}
                        className={`w-10 h-5 rounded-full relative transition-all ${notificationSettings.slack.enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-1 ${notificationSettings.slack.enabled ? 'left-6' : 'left-1'} w-3 h-3 bg-white rounded-full transition-all`} />
                      </button>
                    </div>
                    {notificationSettings.slack.enabled && (
                      <input 
                        type="text" 
                        placeholder="Slack Webhook URL"
                        value={notificationSettings.slack.webhookUrl}
                        onChange={(e) => setNotificationSettings({...notificationSettings, slack: {...notificationSettings.slack, webhookUrl: e.target.value}})}
                        disabled={!canManageSettings}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                      />
                    )}
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Test Notifications</h3>
                  </div>
                  <button
                    onClick={handleTestNotifications}
                    disabled={!canManageSettings || testingNotifications}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      canManageSettings
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {testingNotifications ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Sending Test...
                      </>
                    ) : (
                      <>
                        <Bell size={14} /> Send Test Notifications
                      </>
                    )}
                  </button>
                </section>
              </>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;