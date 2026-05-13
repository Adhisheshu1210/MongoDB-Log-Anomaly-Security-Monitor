import React, { useMemo } from 'react';
import {
  User,
  Mail,
  Shield,
  Clock,
  Award,
  Key,
  FileText,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';


const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userData = useMemo(() => {
    const role = user?.role || 'user';
    const clearanceMap = {
      admin: 'Level 4 (Admin)',
      user: 'Level 2 (User)',
      viewer: 'Level 1 (Viewer)'
    };

    return {
      name: user?.username || user?.name || 'User',
      role:
        role === 'admin' ? 'Administrator' : role === 'viewer' ? 'Viewer' : 'User',
      email: user?.email || '',
      joined: user?.createdAt
        ? new Date(user.createdAt).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short'
          })
        : '—',
      clearance: clearanceMap[role] || '—',
      stats: [
        { label: 'Anomalies Resolved', value: '—', icon: Shield, color: 'text-emerald-400' },
        { label: 'Systems Managed', value: '—', icon: Activity, color: 'text-indigo-400' },
        { label: 'Certifications', value: '—', icon: Award, color: 'text-amber-400' }
      ]
    };
  }, [user]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{userData.role} Profile</h1>
          <p className="text-slate-500 text-sm">Manage your identity and security credentials.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/${(user?.role || 'viewer').toLowerCase()}/profile`)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
          >
            Open Role Profile
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="px-3 py-2 border border-slate-700 text-slate-200 rounded-lg text-sm"
          >
            Settings
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="card p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-indigo-500/20 p-1">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <User size={64} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{userData.name}</h2>
            <p className="text-indigo-400 font-mono text-xs uppercase tracking-widest">{userData.role}</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] text-indigo-400 font-bold">SENTINEL-ID-99</span>
          </div>
        </div>

        {/* Info & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userData.stats.map((stat, i) => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-slate-900 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-slate-400" /> Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">Email Address</label>
                <div className="flex items-center gap-2 text-slate-300"><Mail size={14}/> {userData.email}</div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">Clearance Level</label>
                <div className="flex items-center gap-2 text-slate-300"><Shield size={14}/> {userData.clearance}</div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">Member Since</label>
                <div className="flex items-center gap-2 text-slate-300"><Clock size={14}/> {userData.joined}</div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">Two-Factor Auth</label>
                <div className="flex items-center gap-2 text-emerald-400"><Key size={14}/> ENABLED</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;