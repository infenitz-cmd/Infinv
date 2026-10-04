import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  Building,
  RefreshCw,
  Database,
  Download,
  X,
  Mail,
  Calendar
} from 'lucide-react';
import {
  ROLE_DEFINITIONS,
  getStoredUsers,
  createUser,
  updateUser,
  deleteUser,
  generateRandomPassword,
  getStoreSettings,
  saveStoreSettings
} from '../lib/userStore';
import type { UserAccount, UserRole, SystemSettingsConfig } from '../lib/userStore';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface UserSettingsProps {
  currentUsername: string;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ currentUsername }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'store' | 'cloud'>('users');
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [storeSettings, setStoreSettings] = useState<SystemSettingsConfig>(() => getStoreSettings());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  // Form States for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    password: string;
    role: UserRole;
    email: string;
    phone: string;
    status: 'Active' | 'Inactive';
    notes: string;
  }>({
    name: '',
    username: '',
    password: '',
    role: 'Staff',
    email: '',
    phone: '',
    status: 'Active',
    notes: ''
  });

  const [formShowPassword, setFormShowPassword] = useState(false);
  const [changePassValue, setChangePassValue] = useState('');
  const [changePassShow, setChangePassShow] = useState(false);

  // Password visibility map for table rows
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [supabaseMessage, setSupabaseMessage] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync users across multiple tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'infenitz_system_users' && e.newValue) {
        try {
          setUsers(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'Active').length,
      admins: users.filter((u) => u.role === 'Admin').length,
      managers: users.filter((u) => u.role === 'Manager').length,
      staff: users.filter((u) => u.role === 'Staff' || u.role === 'Inventory Specialist').length,
    };
  }, [users]);

  // Handle open Add Modal
  const handleOpenAddModal = () => {
    const defaultPass = generateRandomPassword();
    setFormData({
      name: '',
      username: '',
      password: defaultPass,
      role: 'Staff',
      email: '',
      phone: '',
      status: 'Active',
      notes: ''
    });
    setFormShowPassword(true);
    setEditingUser(null);
    setIsAddModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role,
      email: user.email || '',
      phone: user.phone || '',
      status: user.status,
      notes: user.notes || ''
    });
    setFormShowPassword(false);
    setIsAddModalOpen(true);
  };

  // Handle Save User (Create or Update)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Please enter the user full name.', 'error');
      return;
    }

    if (!formData.username.trim()) {
      showToast('Please enter a username.', 'error');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 4)) {
      showToast('Password must be at least 4 characters.', 'error');
      return;
    }

    if (editingUser) {
      // Update
      const res = updateUser(editingUser.id, {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        notes: formData.notes,
        ...(formData.password ? { password: formData.password } : {})
      });

      if (!res.success) {
        showToast(res.error || 'Failed to update user.', 'error');
        return;
      }

      setUsers(getStoredUsers());
      setIsAddModalOpen(false);
      showToast(`User "${formData.name}" updated successfully!`);
    } else {
      // Create
      const res = createUser({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        email: formData.email || `${formData.username.toLowerCase()}@infenitz.internal`,
        phone: formData.phone,
        status: formData.status,
        notes: formData.notes
      });

      if (!res.success) {
        showToast(res.error || 'Failed to create user.', 'error');
        return;
      }

      setUsers(getStoredUsers());
      setIsAddModalOpen(false);
      showToast(`User "${formData.name}" created with role "${formData.role}"!`);
    }
  };

  // Handle Quick Password Change
  const handleSavePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPasswordUser) return;
    if (!changePassValue || changePassValue.length < 4) {
      showToast('New password must be at least 4 characters.', 'error');
      return;
    }

    const res = updateUser(changingPasswordUser.id, { password: changePassValue });
    if (!res.success) {
      showToast(res.error || 'Failed to change password.', 'error');
      return;
    }

    setUsers(getStoredUsers());
    showToast(`Password updated for ${changingPasswordUser.username}!`);
    setChangingPasswordUser(null);
    setChangePassValue('');
  };

  // Handle Delete User
  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = deleteUser(deletingUser.id, currentUsername);
    if (!res.success) {
      showToast(res.error || 'Could not delete user.', 'error');
      return;
    }

    setUsers(getStoredUsers());
    showToast(`User "${deletingUser.name}" has been deleted.`);
    setDeletingUser(null);
  };

  // Handle Copy Credentials
  const handleCopyCredentials = (user: UserAccount) => {
    const text = `Username: ${user.username}\nPassword: ${user.password || '(not set)'}\nRole: ${user.role}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    showToast(`Credentials for ${user.username} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle user status
  const handleToggleStatus = (user: UserAccount) => {
    if (user.username.toLowerCase() === currentUsername.toLowerCase()) {
      showToast('You cannot deactivate your own active account.', 'error');
      return;
    }
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    updateUser(user.id, { status: newStatus });
    setUsers(getStoredUsers());
    showToast(`User "${user.name}" marked as ${newStatus}.`);
  };

  // Handle Store Settings Save
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreSettings(storeSettings);
    showToast('Store & System settings saved successfully!');
  };

  // Test Supabase Connection
  const handleTestSupabase = async () => {
    setSupabaseTestStatus('testing');
    setSupabaseMessage('Connecting to Supabase...');

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase environment variables are missing or default placeholder.');
      }
      const { error } = await supabase.from('inventory_items').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setSupabaseTestStatus('success');
      setSupabaseMessage('Successfully connected to Supabase PostgreSQL database!');
      showToast('Database connection verified!');
    } catch (err: any) {
      setSupabaseTestStatus('error');
      setSupabaseMessage(err?.message || 'Failed to ping Supabase.');
      showToast('Connection failed: ' + (err?.message || 'Check credentials'), 'error');
    }
  };

  // Export Users JSON
  const handleExportUsers = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `infenitz_users_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported users JSON file.');
  };

  // Calculate Password Strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'Empty', color: 'bg-slate-200', text: 'text-slate-400', width: '0%' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500', width: '30%' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const score = (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0) + (hasUpper ? 1 : 0);

    if (pass.length >= 8 && score >= 2) {
      return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' };
    }
    return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500', width: '65%' };
  };

  const passStrength = getPasswordStrength(formData.password);

  // Render role badge helper
  const renderRoleBadge = (role: UserRole) => {
    const def = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.Staff;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${def.badgeBg} ${def.badgeText} ${def.borderColor}`}
      >
        <Shield className="w-3 h-3 flex-shrink-0" />
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border animate-slideUp backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/40'
              : 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-950/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Sub-Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white flex items-center justify-center shadow-lg shadow-indigo-950/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  System Settings & User Access
                </h2>
                <p className="text-slate-500 text-sm font-medium">
                  Create users, manage passwords, assign roles & configure store rules.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action: Add User */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all hover:shadow-lg active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts & Passwords</span>
            <span className="ml-1 px-2 py-0.5 text-xs font-black rounded-full bg-blue-100 text-blue-800">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Roles & Permissions Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'store'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Store Profile & Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'cloud'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cloud Sync & Backup</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USER ACCOUNTS & PASSWORDS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
              <span className="text-xs font-semibold text-emerald-600 mt-1 inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {stats.active} Active accounts
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administrators</span>
              <div className="text-2xl font-black text-purple-700 mt-1">{stats.admins}</div>
              <span className="text-xs font-medium text-slate-500">Full system access</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store Managers</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{stats.managers}</div>
              <span className="text-xs font-medium text-slate-500">Stock & attendance</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff / Specialists</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{stats.staff}</div>
              <span className="text-xs font-medium text-slate-500">Counter & ROX shelf</span>
            </div>
          </div>

          {/* Search, Role Filters & Controls */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by name, username, role or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Role:</span>
                {(['all', 'Admin', 'Manager', 'Staff', 'Inventory Specialist'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      roleFilter === r
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r === 'all' ? 'All Roles' : r}
                  </button>
                ))}

                <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">No users found</p>
                        <p className="text-xs text-slate-400 mt-1">Try changing your search terms or role filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isCurrent = user.username.toLowerCase() === currentUsername.toLowerCase();
                      const isPassVisible = visiblePasswords[user.id] || false;

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* User Name & Initials */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                                {user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <span>{user.name}</span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-black bg-blue-100 text-blue-700 rounded-md">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
                                {user.email && (
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Mail className="w-3 h-3 text-slate-300" />
                                    <span>{user.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            {renderRoleBadge(user.role)}
                          </td>

                          {/* Password Preview & Copy */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 font-mono text-xs">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 border border-slate-200 select-all font-semibold">
                                {isPassVisible ? user.password || '(not set)' : '••••••••'}
                              </span>

                              {/* Toggle Show/Hide */}
                              <button
                                type="button"
                                onClick={() =>
                                  setVisiblePasswords((prev) => ({
                                    ...prev,
                                    [user.id]: !prev[user.id]
                                  }))
                                }
                                title={isPassVisible ? 'Hide password' : 'Show password'}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                              >
                                {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>

                              {/* Copy Password */}
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(user)}
                                title="Copy username & password"
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors"
                              >
                                {copiedId === user.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                user.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                }`}
                              ></span>
                              {user.status}
                            </button>
                          </td>

                          {/* Created Date */}
                          <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                            {user.lastLogin && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Active {new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Change Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setChangingPasswordUser(user);
                                  setChangePassValue(generateRandomPassword());
                                  setChangePassShow(true);
                                }}
                                title="Reset / Change Password"
                                className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <Key className="w-4 h-4" />
                              </button>

                              {/* Edit User */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(user)}
                                title="Edit User & Role"
                                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete User */}
                              <button
                                type="button"
                                onClick={() => setDeletingUser(user)}
                                disabled={isCurrent || (user.role === 'Admin' && stats.admins <= 1)}
                                title={
                                  isCurrent
                                    ? 'Cannot delete your own account'
                                    : user.role === 'Admin' && stats.admins <= 1
                                    ? 'Cannot delete last admin'
                                    : 'Delete user'
                                }
                                className={`p-2 rounded-xl transition-colors ${
                                  isCurrent || (user.role === 'Admin' && stats.admins <= 1)
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((role) => {
              const def = ROLE_DEFINITIONS[role];
              const roleCount = users.filter((u) => u.role === role).length;
              return (
                <div
                  key={role}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${def.badgeBg} ${def.badgeText}`}>
                        {role}
                      </span>
                      <span className="text-xs font-extrabold text-slate-400">
                        {roleCount} {roleCount === 1 ? 'user' : 'users'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900">{def.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{def.description}</p>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Granted Permissions:
                      </span>
                      <ul className="space-y-1.5">
                        {def.permissions.map((perm, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{perm}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Assigned:</span>
                    <div className="flex -space-x-1.5">
                      {users
                        .filter((u) => u.role === role)
                        .slice(0, 4)
                        .map((u) => (
                          <div
                            key={u.id}
                            title={u.name}
                            className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center border border-white"
                          >
                            {u.name[0]}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Permissions Comparison Matrix */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Module Access Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                    <th className="py-3 px-4">Feature / Action</th>
                    <th className="py-3 px-4 text-purple-700">Admin</th>
                    <th className="py-3 px-4 text-blue-700">Manager</th>
                    <th className="py-3 px-4 text-emerald-700">Staff / Cashier</th>
                    <th className="py-3 px-4 text-amber-700">Inventory Specialist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { feature: 'View Stock Quantities', admin: true, manager: true, staff: true, specialist: true },
                    { feature: 'Quick Stock Adjustment (+ / -)', admin: true, manager: true, staff: true, specialist: true },
                    { feature: 'Add New Products to Inventory', admin: true, manager: true, staff: false, specialist: true },
                    { feature: 'Delete Products & Wipe Data', admin: true, manager: false, staff: false, specialist: false },
                    { feature: 'ROX Freshness & Shelf-Life Tracker', admin: true, manager: true, staff: true, specialist: true },
                    { feature: 'Modify Expiry Dates & Shelf Days', admin: true, manager: true, staff: false, specialist: true },
                    { feature: 'Mark Items Disposed / Expired', admin: true, manager: true, staff: true, specialist: true },
                    { feature: 'Staff Attendance Check-In / Out', admin: true, manager: true, staff: true, specialist: true },
                    { feature: 'Inspect All Staff Attendance Logs', admin: true, manager: true, staff: false, specialist: false },
                    { feature: 'Create Users & Set Passwords', admin: true, manager: false, staff: false, specialist: false },
                    { feature: 'Change User Roles & Permissions', admin: true, manager: false, staff: false, specialist: false },
                    { feature: 'Supabase Database & Cloud Config', admin: true, manager: false, staff: false, specialist: false },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{row.feature}</td>
                      <td className="py-3 px-4">
                        {row.admin ? (
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.manager ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.staff ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.specialist ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STORE PROFILE & THRESHOLDS */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStoreSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Store Profile & Inventory Defaults</h3>
              <p className="text-xs text-slate-500">Configure global thresholds, ROX default days, and location identity.</p>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Store / Business Name</label>
              <input
                type="text"
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Store Branch / Location</label>
              <input
                type="text"
                value={storeSettings.storeBranch}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeBranch: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Default ROX Shelf-Life (Days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={storeSettings.defaultRoxShelfDays}
                onChange={(e) => setStoreSettings({ ...storeSettings, defaultRoxShelfDays: Number(e.target.value) || 21 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Used as default close date calculation when opening items in ROX.</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Low Stock Alert Threshold (Units)</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={storeSettings.lowStockThreshold}
                onChange={(e) => setStoreSettings({ ...storeSettings, lowStockThreshold: Number(e.target.value) || 25 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Inventory with front+back stock below this quantity is marked "Low Stock".</span>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: CLOUD SYNC & BACKUP */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Supabase Cloud Connection & Sync</h3>
              <p className="text-xs text-slate-500">Live PostgreSQL connection and table health test.</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-bold text-sm text-slate-900">Database Connection Status</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Demo Mode (Local Storage fallback)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={supabaseTestStatus === 'testing'}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-500 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseTestStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <span
                  className={`px-3 py-1 text-xs font-extrabold rounded-full ${
                    isSupabaseConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isSupabaseConfigured ? 'Active' : 'Offline / Demo'}
                </span>
              </div>
            </div>

            {supabaseMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  supabaseTestStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {supabaseTestStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{supabaseMessage}</span>
              </div>
            )}

            {/* Backup & Export */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 mb-3">Data Backup & Export</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleExportUsers}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/30 flex items-center gap-3 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Export Users JSON</div>
                    <div className="text-xs text-slate-400">Download complete user credentials and roles.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const saved = localStorage.getItem('infenitz_inventory_items') || '[]';
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(saved);
                    const a = document.createElement('a');
                    a.setAttribute('href', dataStr);
                    a.setAttribute('download', `infenitz_inventory_${new Date().toISOString().slice(0, 10)}.json`);
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    showToast('Exported inventory JSON backup.');
                  }}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/30 flex items-center gap-3 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Export Inventory Data</div>
                    <div className="text-xs text-slate-400">Download inventory & ROX shelf items backup.</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT USER MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{editingUser ? 'Edit User & Permissions' : 'Create New User Account'}</h3>
                  <p className="text-xs text-slate-300">Set personal details, login credentials, and assign role.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 sm:p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">@</span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="alex.m"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-mono font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password Field with Generator & Strength Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {editingUser ? 'New Password (Leave blank to keep existing)' : 'Account Password'} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newPass = generateRandomPassword();
                      setFormData({ ...formData, password: newPass });
                      setFormShowPassword(true);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={formShowPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Enter new password or leave blank' : 'Enter password'}
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-mono focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFormShowPassword(!formShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {formShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Strength:</span>
                      <span className={passStrength.text}>{passStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passStrength.color} transition-all duration-300`}
                        style={{ width: passStrength.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Role Picker (Interactive Cards) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Assign System Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    const isSelected = formData.role === r;

                    return (
                      <div
                        key={r}
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${def.badgeBg} ${def.badgeText}`}>
                            {r}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{def.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Info (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@infenitz.internal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800">Account Status</span>
                  <p className="text-[11px] text-slate-400">Inactive users will be blocked from logging into the portal.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      status: formData.status === 'Active' ? 'Inactive' : 'Active'
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    formData.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${formData.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                  />
                  <span>{formData.status}</span>
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all active:scale-95"
                >
                  {editingUser ? 'Save User Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK CHANGE PASSWORD MODAL */}
      {/* ========================================================================= */}
      {changingPasswordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5" />
                <div>
                  <h3 className="font-extrabold text-sm">Change Password</h3>
                  <p className="text-[11px] text-amber-100">Updating credentials for @{changingPasswordUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangingPasswordUser(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePasswordChange} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase">New Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setChangePassValue(generateRandomPassword());
                      setChangePassShow(true);
                    }}
                    className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={changePassShow ? 'text' : 'password'}
                    value={changePassValue}
                    onChange={(e) => setChangePassValue(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-mono focus:bg-white focus:border-amber-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setChangePassShow(!changePassShow)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {changePassShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setChangingPasswordUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete <strong className="text-slate-800">{deletingUser.name}</strong> (@{deletingUser.username})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/25 transition-all"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
