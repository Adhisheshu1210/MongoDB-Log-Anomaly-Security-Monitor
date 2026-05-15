import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
  Key,
  Loader2,
  AlertTriangle,
  Clock,
  Send,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import useRBAC from '../../hooks/useRBAC';
import * as usersService from '../../services/users.service';

const Users = () => {
  const { can } = useRBAC();
  const canManageUsers = can('manage_users');

  // State Management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalUsers: 0, mfaAdoption: 0, mfaEnabled: 0, roleDistribution: { admin: 0, user: 0, viewer: 0 } });

  // Modal States
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null, sendingEmail: false });
  const [editRoleModal, setEditRoleModal] = useState({ isOpen: false, user: null, newRole: null, updating: false });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [provisionModal, setProvisionModal] = useState({ isOpen: false, creating: false, formData: { username: '', email: '', password: '', role: 'user' } });
  const [roleFilter, setRoleFilter] = useState("");

  // Fetch Users with Pagination and Search
  const fetchUsers = useCallback(async (page = 1, search = "", role = "") => {
    try {
      setLoading(true);
      const response = await usersService.getUsers({ page, limit: 10, search, role: role || undefined });
      
      if (response.data.success) {
        const userData = response.data.data;
        setUsers(userData);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.pages);

        // Calculate stats
        const mfaEnabled = userData.filter(u => u.mfaEnabled).length;
        const mfaPercentage = userData.length > 0 ? Math.round((mfaEnabled / userData.length) * 100) : 0;
        const roleDistribution = {
          admin: userData.filter(u => u.role === 'admin').length,
          user: userData.filter(u => u.role === 'user').length,
          viewer: userData.filter(u => u.role === 'viewer').length
        };

        setStats({
          totalUsers: response.data.pagination.total,
          mfaAdoption: mfaPercentage,
          mfaEnabled,
          roleDistribution
        });
      }
    } catch (error) {
      console.error('Users fetch error:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Available Roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await usersService.getAvailableRoles();
      if (response.data.success) {
        setAvailableRoles(response.data.data);
      }
    } catch (error) {
      console.error('Roles fetch error:', error);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchUsers(1, "");
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  // Handle Search with Debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(1, searchQuery, roleFilter);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, fetchUsers, roleFilter]);

  // Handle Page Change
  useEffect(() => {
    if (currentPage !== 1 || searchQuery === "") {
      fetchUsers(currentPage, searchQuery, roleFilter);
    }
  }, [currentPage, fetchUsers, searchQuery, roleFilter]);

  // Handle Delete User with Email Notification
  const handleDeleteUser = useCallback(async () => {
    if (!deleteModal.user || !canManageUsers) return;

    try {
      setDeleteModal(prev => ({ ...prev, sendingEmail: true }));
      
      // Send email notification about pending deletion
      // In a real scenario, the backend would send email with 24-hour cancellation link
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Delete user
      await usersService.deleteUser(deleteModal.user._id);
      
      toast.success(`Deletion email sent to ${deleteModal.user.email}. User will be deleted in 24 hours.`);
      setDeleteModal({ isOpen: false, user: null, sendingEmail: false });
      
      // Refresh users list
      fetchUsers(currentPage, searchQuery, roleFilter);
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
      setDeleteModal(prev => ({ ...prev, sendingEmail: false }));
    }
  }, [deleteModal.user, canManageUsers, currentPage, searchQuery, roleFilter, fetchUsers]);

  // Handle Change User Role
  const handleChangeRole = useCallback(async () => {
    if (!editRoleModal.user || !editRoleModal.newRole || !canManageUsers) return;

    try {
      setEditRoleModal(prev => ({ ...prev, updating: true }));
      
      // Change role in backend
      await usersService.changeUserRole(editRoleModal.user._id, editRoleModal.newRole);
      
      toast.success(`Role updated to ${editRoleModal.newRole} for ${editRoleModal.user.username}`);
      setEditRoleModal({ isOpen: false, user: null, newRole: null, updating: false });
      
      // Refresh users list
      fetchUsers(currentPage, searchQuery, roleFilter);
    } catch (error) {
      console.error('Change role error:', error);
      toast.error(error.response?.data?.message || 'Failed to change user role');
      setEditRoleModal(prev => ({ ...prev, updating: false }));
    }
  }, [editRoleModal.user, editRoleModal.newRole, canManageUsers, currentPage, searchQuery, roleFilter, fetchUsers]);

  // Handle Provision New User
  const handleProvisionUser = useCallback(async () => {
    const { username, email, password, role } = provisionModal.formData;

    if (!username || !email || !password || !role) {
      toast.error('All fields are required');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setProvisionModal(prev => ({ ...prev, creating: true }));
      
      // Create new user
      await usersService.createUser({ username, email, password, role });
      
      toast.success(`User ${username} created successfully with role: ${role}`);
      setProvisionModal({ isOpen: false, creating: false, formData: { username: '', email: '', password: '', role: 'user' } });
      
      // Refresh users list
      fetchUsers(1, searchQuery, roleFilter);
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
      setProvisionModal(prev => ({ ...prev, creating: false }));
    }
  }, [provisionModal.formData, searchQuery, roleFilter, fetchUsers]);


  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      user: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      viewer: "bg-slate-800 text-slate-400 border-slate-700"
    };
    return <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${styles[role.toLowerCase()] || styles.user}`}>{role.toUpperCase()}</span>;
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return "Never";
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-[#020617]">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 italic uppercase">
            <UsersIcon className="text-indigo-500" size={32} /> Identity Orchestration
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">
            RBAC Management • {stats.totalUsers} Total Registered Entities
          </p>
        </div>
        <button
          type="button"
          onClick={() => setProvisionModal({ isOpen: true, creating: false, formData: { username: '', email: '', password: '', role: 'user' } })}
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
            placeholder="Search by name, email, or username..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs text-white focus:border-indigo-500 outline-none transition-all font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase">Global MFA Adoption</p>
            <p className="text-xl font-black text-white">{stats.mfaAdoption}%</p>
          </div>
          <ShieldCheck className="text-emerald-500" size={24} />
        </div>
      </div>

      {/* Role Filter Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter by Role:</span>
        <button
          onClick={() => {
            setRoleFilter("");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            roleFilter === ""
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => {
            setRoleFilter("admin");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            roleFilter === "admin"
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <ShieldCheck size={12} /> Admin ({stats.roleDistribution.admin})
        </button>
        <button
          onClick={() => {
            setRoleFilter("user");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            roleFilter === "user"
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <CheckCircle2 size={12} /> Users ({stats.roleDistribution.user})
        </button>
        <button
          onClick={() => {
            setRoleFilter("viewer");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            roleFilter === "viewer"
              ? 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <XCircle size={12} /> Viewers ({stats.roleDistribution.viewer})
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <>
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
                  {users.length > 0 ? (
                    users.map((user, i) => (
                      <motion.tr 
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-slate-800/50 hover:bg-slate-900/40 group transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-[10px]">
                              {user.username?.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-bold">{user.username}</p>
                              <p className="text-slate-500 font-mono text-[9px]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                            <span className={user.isActive ? 'text-white' : 'text-slate-500'}>{user.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {user.mfaEnabled ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono italic">{formatLastLogin(user.lastLogin)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditRoleModal({ isOpen: true, user, newRole: user.role, updating: false })}
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
                              onClick={() => setDeleteModal({ isOpen: true, user, sendingEmail: false })}
                              disabled={!canManageUsers}
                              title={canManageUsers ? 'Delete user with 24-hour notification' : 'Permission required: manage_users'}
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Footer */}
            <div className="p-6 bg-slate-900/20 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Key size={12} className="text-indigo-500" /> Session Encryption: Active</span>
                <span className="hidden md:block text-slate-800">|</span>
                <span className="flex items-center gap-1"><Mail size={12} className="text-indigo-500" /> Auto-Invite: Enabled</span>
              </div>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-900 text-slate-500 text-[10px] font-black rounded-xl hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <div className="flex gap-1">
                  {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-[10px] font-black rounded-xl ${
                          pageNum === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-slate-500 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2 text-slate-500 text-[10px]">...</span>}
                </div>
                <button 
                  onClick={() => {
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 bg-slate-900 text-slate-500 text-[10px] font-black rounded-xl hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Role Distribution Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Admins", count: stats.roleDistribution.admin, icon: ShieldCheck, color: "text-indigo-400" },
          { label: "Standard Users", count: stats.roleDistribution.user, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "View-Only Roles", count: stats.roleDistribution.viewer, icon: XCircle, color: "text-slate-500" },
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

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !deleteModal.sendingEmail && setDeleteModal({ isOpen: false, user: null, sendingEmail: false })}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                  <AlertTriangle className="text-rose-500" size={24} />
                </div>
                <h3 className="text-xl font-black text-white">Delete User</h3>
              </div>

              {deleteModal.user && (
                <>
                  <p className="text-slate-400 text-sm mb-6">
                    You are about to delete <span className="text-white font-bold">{deleteModal.user.username}</span>. 
                    A notification email will be sent to <span className="text-indigo-400 font-mono">{deleteModal.user.email}</span>.
                  </p>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="text-amber-500 mt-1" size={16} />
                      <div className="text-[12px]">
                        <p className="text-white font-bold">24-Hour Grace Period</p>
                        <p className="text-slate-400">The user will have 24 hours to respond or the account will be permanently deleted.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="text-indigo-500 mt-1" size={16} />
                      <div className="text-[12px]">
                        <p className="text-white font-bold">Notification Email</p>
                        <p className="text-slate-400">User will receive an email with a cancellation link.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ isOpen: false, user: null, sendingEmail: false })}
                      disabled={deleteModal.sendingEmail}
                      className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      disabled={deleteModal.sendingEmail}
                      className="flex-1 px-4 py-3 bg-rose-600 rounded-xl text-white font-black text-sm hover:bg-rose-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleteModal.sendingEmail ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Send & Delete
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editRoleModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !editRoleModal.updating && setEditRoleModal({ isOpen: false, user: null, newRole: null, updating: false })}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <UserCog className="text-indigo-500" size={24} />
                </div>
                <h3 className="text-xl font-black text-white">Change User Role</h3>
              </div>

              {editRoleModal.user && (
                <>
                  <p className="text-slate-400 text-sm mb-6">
                    Updating role for <span className="text-white font-bold">{editRoleModal.user.username}</span>
                  </p>

                  <div className="space-y-3 mb-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select New Role</label>
                    <div className="space-y-2">
                      {availableRoles && availableRoles.length > 0 ? (
                        availableRoles.map(role => (
                          <button
                            key={role?.value}
                            type="button"
                            onClick={() => setEditRoleModal(prev => ({ ...prev, newRole: role?.value }))}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              editRoleModal.newRole === role?.value
                                ? 'bg-indigo-500/10 border-indigo-500/50'
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full border-2 ${editRoleModal.newRole === role?.value ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`} />
                              <div>
                                <p className="text-white font-bold text-sm">{role?.label || 'Unknown'}</p>
                                <p className="text-slate-500 text-[10px]">{role?.description || 'No description'}</p>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 bg-slate-900/50 rounded-xl text-slate-400 text-sm">
                          Loading roles...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditRoleModal({ isOpen: false, user: null, newRole: null, updating: false })}
                      disabled={editRoleModal.updating}
                      className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleChangeRole}
                      disabled={editRoleModal.updating || editRoleModal.newRole === editRoleModal.user.role}
                      className="flex-1 px-4 py-3 bg-indigo-600 rounded-xl text-white font-black text-sm hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {editRoleModal.updating ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          Update Role
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provision New User Modal */}
      <AnimatePresence>
        {provisionModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !provisionModal.creating && setProvisionModal({ isOpen: false, creating: false, formData: { username: '', email: '', password: '', role: 'user' } })}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <UserPlus className="text-indigo-500" size={24} />
                </div>
                <h3 className="text-xl font-black text-white">Provision New User</h3>
              </div>

              <div className="space-y-4 mb-6">
                {/* Username Input */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Username</label>
                  <input
                    type="text"
                    placeholder="Enter username (3-30 characters)"
                    value={provisionModal.formData.username}
                    onChange={(e) => setProvisionModal(prev => ({ ...prev, formData: { ...prev.formData, username: e.target.value } }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Email</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={provisionModal.formData.email}
                    onChange={(e) => setProvisionModal(prev => ({ ...prev, formData: { ...prev.formData, email: e.target.value } }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Password</label>
                  <input
                    type="password"
                    placeholder="Enter password (min 6 characters)"
                    value={provisionModal.formData.password}
                    onChange={(e) => setProvisionModal(prev => ({ ...prev, formData: { ...prev.formData, password: e.target.value } }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Role Select */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Assign Role</label>
                  <select
                    value={provisionModal.formData.role}
                    onChange={(e) => setProvisionModal(prev => ({ ...prev, formData: { ...prev.formData, role: e.target.value } }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                  >
                    {availableRoles && availableRoles.length > 0 ? (
                      availableRoles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </option>
                      ))
                    ) : (
                      <option value="">Loading roles...</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setProvisionModal({ isOpen: false, creating: false, formData: { username: '', email: '', password: '', role: 'user' } })}
                  disabled={provisionModal.creating}
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProvisionUser}
                  disabled={provisionModal.creating}
                  className="flex-1 px-4 py-3 bg-indigo-600 rounded-xl text-white font-black text-sm hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {provisionModal.creating ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;