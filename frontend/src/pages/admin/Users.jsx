import React, { useState, useEffect, useMemo } from 'react';
// 🚀 Custom Axios instance configured with base URL and credentials
import API from '../../api/authApi'; 

const Users = () => {
  // Application Data States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Tracks specific user ID or 'create' execution loaders
  
  // Real-time Status Alert Feedback Banners
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

  // Create User Slidedown Panel Toggle State
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New Identity Creation Form State
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student', password: '' });

  // Inline Row Profile Editing Management States
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: '', password: '' });

  // 🔍 Smart Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // 📄 Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✨ Track newly added user IDs for visual highlighting
  const [newlyAddedId, setNewlyAddedId] = useState(null);

  // Fetch all user accounts on component initialization
  useEffect(() => {
    fetchUsers();
  }, []);

  // Utility helper to display feedback alerts across transient timers
  const triggerAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage({ type: '', text: '' }), 4000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/users');
      setUsers(response.data.data || []);
    } catch (err) {
      triggerAlert('error', err.response?.data?.error || 'System Error: Failed to retrieve user identity access logs.');
    } finally {
      setLoading(false);
    }
  };

  // Dispatch network POST requests to create new identities
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUser.password.length < 6) {
      return triggerAlert('error', 'Account master key parameters must be at least 6 characters.');
    }

    try {
      setActionLoading('create');
      const response = await API.post('/admin/users', newUser);
      if (response.data.success) {
        const createdUser = response.data.data;
        setUsers((prev) => [createdUser, ...prev]);
        setNewUser({ name: '', email: '', role: 'student', password: '' });
        setShowCreateForm(false);
        setNewlyAddedId(createdUser._id);
        setCurrentPage(1); // Jump to first page to see the new record
        triggerAlert('success', 'User account identity provisioned securely.');

        // Clear highlight pulse after 4 seconds
        setTimeout(() => setNewlyAddedId(null), 4000);
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.error || 'Failed to create new system identity.');
    } finally {
      setActionLoading(null);
    }
  };

  // Event Isolated Editing State Activator
  const startEditing = (e, user) => {
    e.stopPropagation();
    setEditingUserId(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
  };

  // Discards transient editing variable buffer configurations cleanly
  const cancelEditing = (e) => {
    if (e) e.stopPropagation();
    setEditingUserId(null);
    setFormData({ name: '', email: '', role: '', password: '' });
  };

  // Persists edited identity parameters securely via structural endpoint overwrites
  const handleSaveAdminOverride = async (e, userId) => {
    e.stopPropagation();
    try {
      setActionLoading(userId);
      const payload = { ...formData };
      
      if (!payload.password.trim()) {
        delete payload.password;
      } else if (payload.password.length < 6) {
        return triggerAlert('error', 'Override password signatures must track across 6 characters minimum.');
      }

      const response = await API.put(`/admin/users/${userId}`, payload);
      if (response.data.success) {
        setUsers((prev) =>
          prev.map((user) => (user._id === userId ? { ...user, ...response.data.data } : user))
        );
        setEditingUserId(null);
        triggerAlert('success', 'User account parameters modified.');
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.error || 'Authorization error: Administrative update rejected.');
    } finally {
      setActionLoading(null);
    }
  };

  // 🗑️ Handles permanently deleting user profile records
  const handleDeleteUser = async (e, userId, userName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete the identity profile for "${userName}"?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await API.delete(`/admin/users/${userId}`);
      if (response.data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        triggerAlert('success', `User account for ${userName} removed from registry.`);
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.error || 'Failed to purge user record from access database.');
    } finally {
      setActionLoading(null);
    }
  };

  // 🧠 Smart Multi-Field Filtering Logic
  const filteredUsers = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    
    return users.filter((user) => {
      // Role match check
      const matchesRole = selectedRoleFilter === 'all' || user.role === selectedRoleFilter;
      
      // Smart multi-field search check
      const matchesSearch =
        !cleanSearch ||
        user.name?.toLowerCase().includes(cleanSearch) ||
        user.email?.toLowerCase().includes(cleanSearch) ||
        user.role?.toLowerCase().includes(cleanSearch);

      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, selectedRoleFilter]);

  // Reset pagination page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRoleFilter, itemsPerPage]);

  // 📄 Pagination Slice Calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  const currentTableData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // 📊 Calculated System Quick Stats
  const roleCounts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      { student: 0, instructor: 0, admin: 0 }
    );
  }, [users]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 antialiased selection:bg-indigo-500 selection:text-white">
      
      <main className="flex-grow py-8 px-4 max-w-7xl mx-auto w-full">
        
        {/* Real-time Dynamic Alert Banner Notification Layer */}
        {alertMessage.text && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all transform duration-300 animate-slideIn ${
            alertMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {alertMessage.text}
          </div>
        )}

        {/* Action Header Layout Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Identity & User Access</h1>
            <p className="text-sm text-gray-500 mt-1">Review operational permissions, update profile variables, and assign security roles.</p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all text-white flex items-center justify-center gap-2 ${
              showCreateForm ? 'bg-gray-600 hover:bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <span>{showCreateForm ? 'Close Panel' : '+ Create User'}</span>
          </button>
        </div>

        {/* 📊 Interactive Smart Analytics Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRoleFilter === 'all'
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Accounts</p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">{users.length}</p>
          </button>

          <button
            onClick={() => setSelectedRoleFilter('student')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRoleFilter === 'student'
                ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400/20'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xs font-semibold text-gray-500 uppercase">Students</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{roleCounts.student}</p>
          </button>

          <button
            onClick={() => setSelectedRoleFilter('instructor')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRoleFilter === 'instructor'
                ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xs font-semibold text-blue-600 uppercase">Instructors</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{roleCounts.instructor}</p>
          </button>

          <button
            onClick={() => setSelectedRoleFilter('admin')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRoleFilter === 'admin'
                ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xs font-semibold text-purple-600 uppercase">Admins</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{roleCounts.admin}</p>
          </button>
        </div>

        {/* Provision New Account Slidedown Panel */}
        {showCreateForm && (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-3xl transform transition-all duration-300 ease-out animate-fadeIn">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Provision New Identity Account</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="name@university.edu"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">System Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50"
                >
                  {actionLoading === 'create' ? 'Saving Account...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 🔍 Smart Search Bar & Quick Filter Controls */}
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Multi-field search box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {/* Search Icon */}
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase mr-1">Filter Role:</span>
            {['all', 'student', 'instructor', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedRoleFilter === role
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
            
            {(searchTerm || selectedRoleFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRoleFilter('all');
                }}
                className="text-xs text-indigo-600 hover:underline font-semibold ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Master Control Layout Ledger Matrix */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-500 text-sm font-medium">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
            Syncing identity access control registries...
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th style={{ width: '17%' }} className="px-6 py-4">Account Holder Name</th>
                    <th style={{ width: '21%' }} className="px-6 py-4">Email Address</th>
                    <th style={{ width: '12%' }} className="px-6 py-4">Role</th>
                    <th style={{ width: '12%' }} className="px-6 py-4">Password</th>
                    <th style={{ width: '11%' }} className="px-6 py-4">Joined Date</th>
                    <th style={{ width: '22%' }} className="px-6 py-4 text-right">Execution Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((user) => {
                      const isEditing = editingUserId === user._id;
                      const isRowLoading = actionLoading === user._id;
                      const isNew = newlyAddedId === user._id;
                      
                      return (
                        <tr
                          key={user._id}
                          className={`transition-colors ${
                            isNew ? 'bg-emerald-50/80 animate-pulse' :
                            isEditing ? 'bg-indigo-50/40' : 'hover:bg-gray-50/60'
                          }`}
                        >
                          
                          {/* Column 1: Name */}
                          <td className="px-6 py-4 align-middle">
                            {isEditing ? (
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-semibold shadow-sm"
                              />
                            ) : (
                              <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                                {user.name}
                                {isNew && (
                                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">NEW</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Column 2: Email Address */}
                          <td className="px-6 py-4 align-middle">
                            {isEditing ? (
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                              />
                            ) : (
                              <div className="text-xs font-mono text-gray-600 truncate">{user.email}</div>
                            )}
                          </td>

                          {/* Column 3: Role Parameters */}
                          <td className="px-6 py-4 whitespace-nowrap align-middle">
                            {isEditing ? (
                              <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full text-xs bg-white border border-gray-300 rounded p-1.5 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                              >
                                <option value="student">Student</option>
                                <option value="instructor">Instructor</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wider ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'instructor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </td>

                          {/* Column 4: Password Controls */}
                          <td className="px-6 py-4 whitespace-nowrap align-middle">
                            {isEditing ? (
                              <input
                                type="password"
                                placeholder="Overwrite password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                              />
                            ) : (
                              <span className="text-xs font-mono text-gray-300 tracking-widest select-none">••••••••</span>
                            )}
                          </td>

                          {/* Column 5: Account Timestamp */}
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm align-middle">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          {/* Column 6: Execution Controls Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => handleSaveAdminOverride(e, user._id)}
                                  disabled={isRowLoading}
                                  className="text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50"
                                >
                                  {isRowLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={(e) => cancelEditing(e)}
                                  disabled={isRowLoading}
                                  className="text-gray-700 hover:text-gray-900 bg-white border border-gray-300 shadow-sm px-3 py-1.5 rounded text-xs font-medium transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => startEditing(e, user)}
                                  disabled={isRowLoading}
                                  className="text-gray-700 hover:text-indigo-600 font-semibold text-xs bg-white hover:bg-indigo-50/50 px-3 py-1.5 rounded border border-gray-300 hover:border-indigo-300 shadow-sm transition-all duration-150"
                                >
                                  Modify Profile
                                </button>
                                <button
                                  onClick={(e) => handleDeleteUser(e, user._id, user.name)}
                                  disabled={isRowLoading}
                                  className="text-red-600 hover:text-white font-semibold text-xs bg-white hover:bg-red-600 px-3 py-1.5 rounded border border-red-200 hover:border-red-600 shadow-sm transition-all duration-150 disabled:opacity-50"
                                >
                                  {isRowLoading ? 'Purging...' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-2xl">🔎</span>
                          <span className="font-semibold text-gray-700">No matching user accounts discovered</span>
                          <span className="text-xs text-gray-400">Try adjusting your search criteria or resetting filters.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 📄 Dynamic Pagination Navigation Footbar */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Pagination Info & Per Page Controls */}
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>
                  Showing <strong className="text-gray-900">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
                  <strong className="text-gray-900">{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
                  <strong className="text-gray-900">{totalItems}</strong> accounts
                </span>

                <div className="flex items-center gap-1">
                  <label className="text-gray-500">Per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-all"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1.5 rounded text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-all"
                >
                  Next
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
      
    </div>
  );
};

export default Users;