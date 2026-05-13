import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  Trash2, 
  UserCog,
  CheckCircle2,
  XCircle,
  Key
} from 'lucide-react';
import useRBAC from '../../hooks/useRBAC';

const Users = () => {
  const { can } = useRBAC();
  const canManageUsers = can('manage_users');
  const [searchQuery, setSearchQuery] = useState("");

  const users = [
    { id: 1, name: "Nakka Srijith", email: "srijith@vardhaman.edu", role: "ADMIN", status: "Active", mfa: true, lastLogin: "2 mins ago" },
    { id: 2, name: "Aarav Sharma", email: "aarav.s@siem.io", role: "USER", status: "Active", mfa: true, lastLogin: "1h ago" },
    { id: 3, name: "Elena Gilbert", email: "elena.g@corp.com", role: "VIEWER", status: "Inactive", mfa: false, lastLogin: "3 days ago" },
    { id: 4, name: "Marcus Wright", email: "m.wright@sec.net", role: "USER", status: "Active", mfa: true, lastLogin: "12h ago" },
    { id: 5, name: "Sarah Connor", email: "s.connor@resistance.io", role: "ADMIN", status: "Active", mfa: true, lastLogin: "Just now" },
  ];

  const getRoleBadge = (role) => {
    const styles = {
      ADMIN: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      USER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      VIEWER: "bg-slate-800 text-slate-400 border-slate-700"
    };
    return <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${styles[role]}`}>{role}</span>;
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 italic">
            <UsersIcon className="text-indigo-500" size={32} /> Identity Orchestration
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">
            RBAC Management • {users.length} Total Registered Entities
          </p>
        </div>
        <button
          type="button"
          disabled={!canManageUsers}
          title={canManageUsers ? 'Provision new user' : 'Permission required: manage_users'}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            canManageUsers
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <UserPlus size={16} /> Provision New User
        </button>
      </header>

      {/* Stats & Search Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, or unique UID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs text-white focus:border-indigo-500 outline-none transition-all font-mono"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase">Global MFA Adoption</p>
            <p className="text-xl font-black text-white">80%</p>
          </div>
          <ShieldCheck className="text-emerald-500" size={24} />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <th className="px-6 py-5">User Entity</th>
                <th className="px-6 py-5">Access Level</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-center">MFA</th>
                <th className="px-6 py-5">Activity Trace</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {users.map((user, i) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-800/50 hover:bg-slate-900/40 group transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-[10px]">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-bold">{user.name}</p>
                        <p className="text-slate-500 font-mono text-[9px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                      <span className={user.status === 'Active' ? 'text-white' : 'text-slate-500'}>{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {user.mfa ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono italic">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={!canManageUsers}
                        title={canManageUsers ? 'Edit user role and access' : 'Permission required: manage_users'}
                        className={`p-2 bg-slate-900 border border-slate-800 rounded-lg transition-all ${
                          canManageUsers
                            ? 'text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50'
                            : 'text-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <UserCog size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={!canManageUsers}
                        title={canManageUsers ? 'Delete user' : 'Permission required: manage_users'}
                        className={`p-2 bg-slate-900 border border-slate-800 rounded-lg transition-all ${
                          canManageUsers
                            ? 'text-slate-400 hover:text-rose-500 hover:border-rose-500/50'
                            : 'text-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-slate-900/20 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Key size={12} className="text-indigo-500" /> Session Encryption: Active</span>
              <span className="hidden md:block text-slate-800">|</span>
              <span className="flex items-center gap-1"><Mail size={12} className="text-indigo-500" /> Auto-Invite: Enabled</span>
           </div>
           <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-900 text-slate-500 text-[10px] font-black rounded-xl hover:text-white transition-all">Prev</button>
              <button className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl">1</button>
              <button className="px-4 py-2 bg-slate-900 text-slate-500 text-[10px] font-black rounded-xl hover:text-white transition-all">Next</button>
           </div>
        </div>
      </div>

      {/* Role Distribution Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Admins", count: 2, icon: ShieldCheck, color: "text-indigo-400" },
          { label: "Standard Users", count: 18, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "View-Only Roles", count: 5, icon: XCircle, color: "text-slate-500" },
        ].map((role, i) => (
          <div key={i} className="p-6 bg-slate-900/30 border border-slate-800 rounded-3xl flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 ${role.color}`}>
              <role.icon size={24} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{role.label}</h4>
              <p className="text-2xl font-black text-white">{role.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;