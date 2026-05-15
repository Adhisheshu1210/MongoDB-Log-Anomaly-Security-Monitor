import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Clock,
  Award,
  Key,
  FileText,
  Activity,
  Terminal,
  Fingerprint,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useRBAC from '../../hooks/useRBAC';
import AIInsights from '../user/AIInsights';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canAny } = useRBAC();
  const canManageSettings = canAny(['manage_settings', 'manage_users']);

  const userData = useMemo(() => {
    const role = user?.role || 'user';
    const clearanceMap = {
      admin: 'Level 4 (Full System Access)',
      user: 'Level 2 (Standard Operations)',
      viewer: 'Level 1 (Read-Only)'
    };

    return {
      name: user?.username || user?.name || 'Authorized Entity',
      role: role === 'admin' ? 'System Administrator' : role === 'viewer' ? 'Security Viewer' : 'Security Operative',
      email: user?.email || 'N/A',
      joined: user?.createdAt
        ? new Date(user.createdAt).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : '—',
      clearance: clearanceMap[role] || '—',
      stats: [
        { label: 'Threats Mitigated', value: '1,204', icon: Shield, color: 'text-emerald-400' },
        { label: 'Uptime Managed', value: '99.9%', icon: Activity, color: 'text-indigo-400' },
        { label: 'Security Badges', value: '12', icon: Award, color: 'text-amber-400' }
      ]
    };
  }, [user]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Dynamic Breadcrumb Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
            <Fingerprint size={12} /> Biometric ID Verified
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">{userData.role} Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage identity, clearance and security settings for this account.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/${(user?.role || 'user').toLowerCase()}/profile`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase transition-all"
          >
            Open Role Profile
          </button>
          <button
            type="button"
            disabled={!canManageSettings}
            title={canManageSettings ? 'Update account credentials' : 'Permission required: manage_settings or manage_users'}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all ${
              canManageSettings
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-700 cursor-not-allowed'
            }`}
          >
            Update Credentials
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Identity Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-8 bg-slate-900/40 border-slate-800 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield size={120} className="text-indigo-500" />
            </div>
            
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-indigo-500/20 p-1 shadow-2xl shadow-indigo-500/10">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <User size={60} className="text-white" />
                </div>
              </div>
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 border-4 border-[#020617] rounded-full flex items-center justify-center shadow-lg">
                <Zap size={14} className="text-white fill-white" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{userData.name}</h2>
              <p className="text-indigo-400 font-mono text-[10px] uppercase tracking-[0.3em] mt-1">{userData.role}</p>
            </div>

            <div className="w-full pt-4 border-t border-slate-800/50">
              <div className="flex justify-between items-center px-4">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Employee UID</span>
                <span className="text-[10px] font-mono text-slate-300">SN-2026-99A1</span>
              </div>
            </div>
          </div>

          {/* Quick Actions / Terminal Mockup */}
          <div className="card p-6 bg-slate-950 border-slate-800">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Terminal size={14} /> Security Session Logs
             </h3>
             <div className="space-y-2 font-mono text-[9px] text-slate-500">
                <p><span className="text-emerald-500">AUTH</span>: Login success 10.0.4.122</p>
                <p><span className="text-indigo-400">SIGN</span>: RSA-Key verified</p>
                <p><span className="text-slate-600">AUDIT</span>: Dashboard access granted</p>
             </div>
          </div>
        </div>

        {/* Detailed Stats & Account Section */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userData.stats.map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-5 flex items-center gap-4 bg-slate-900/30 border-slate-800 group hover:border-indigo-500/30 transition-all"
              >
                <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">{stat.label}</p>
                  <p className="text-2xl font-black text-white leading-none mt-1">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detailed Credentials Card */}
          <div className="card p-8 space-y-8 bg-slate-900/20 border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" /> Account Integrity Dossier
              </h3>
              <span className="text-[9px] font-mono text-slate-600 italic">v2.4 SEC-OPS-READY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Official Email</label>
                <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 text-slate-200 text-xs font-medium">
                  <Mail size={16} className="text-indigo-500" /> {userData.email}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Clearance Protocol</label>
                <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 text-slate-200 text-xs font-medium">
                  <Shield size={16} className="text-indigo-500" /> {userData.clearance}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Member Induction</label>
                <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 text-slate-200 text-xs font-medium">
                  <Clock size={16} className="text-indigo-500" /> {userData.joined}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Identity Protection</label>
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-3 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <Key size={16} /> 2FA Active
                  </div>
                  <span className="text-[8px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded">SECURE</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                disabled={!canManageSettings}
                title={canManageSettings ? 'Open full audit history' : 'Permission required: manage_settings or manage_users'}
                className={`text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${
                  canManageSettings ? 'text-indigo-400 hover:text-white' : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                View Full Audit History <Award size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div>
        <AIInsights />
      </div>
    </div>
  );
};

export default Profile;