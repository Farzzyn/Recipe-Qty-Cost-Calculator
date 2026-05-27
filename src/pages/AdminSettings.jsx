import { useState, useEffect } from 'react';
import { Shield, UserPlus, Lock, User, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2, Users, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../services/supabase';

export default function AdminSettings() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '',
    canDeleteRecipe: false
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await mockDb.getUsers(user?.id);
    if (!res.error) setUsersList(res.data);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    setError('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await mockDb.createUser(
        formData.username, 
        formData.password, 
        'User', // Force all new users to be standard users
        formData.canDeleteRecipe,
        user?.id
      );
      
      if (res.error) throw res.error;
      
      setSuccess(`User '${formData.username}' created successfully as a Standard User!`);
      setFormData({ 
        username: '', 
        password: '', 
        confirmPassword: '', 
        canDeleteRecipe: false 
      });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'Admin' ? 'User' : 'Admin';
    if (targetUser.id === user?.id && newRole !== 'Admin') {
      alert("You cannot remove your own Admin role.");
      return;
    }
    const res = await mockDb.updateUser(targetUser.id, { role: newRole }, user?.id);
    if (!res.error) fetchUsers();
  };

  const handleToggleDeletePerm = async (targetUser) => {
    const res = await mockDb.updateUser(targetUser.id, { can_delete_recipe: !targetUser.can_delete_recipe }, user?.id);
    if (!res.error) fetchUsers();
  };

  const handleDeleteUser = async (targetId) => {
    if (targetId === user?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      const res = await mockDb.deleteUser(targetId, user?.id);
      if (!res.error) fetchUsers();
      else alert(res.error.message);
    }
  };

  const filteredUsers = usersList.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-500" /> Admin Settings
        </h1>
        <p className="text-slate-400">Manage internal users and role-based access controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create User Form */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border-purple-500/20 shadow-[0_0_20px_rgba(147,51,234,0.05)]">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create New User</h2>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-500"
                  placeholder="New username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-500"
                  placeholder="Enter secure password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Retype Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-500"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Access Rights</label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <div>
                    <p className="text-sm font-medium text-slate-200">System Role</p>
                    <p className="text-xs text-slate-500">Standard User (Locked)</p>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 text-slate-400 text-sm rounded-lg px-3 py-1.5 cursor-not-allowed">
                    Standard User
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 cursor-pointer hover:border-purple-500/30 transition-colors"
                  onClick={() => setFormData(prev => ({ ...prev, canDeleteRecipe: !prev.canDeleteRecipe }))}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">Grant Delete Permission</p>
                    <p className="text-xs text-slate-500">Allow user to permanently delete recipes</p>
                  </div>
                  <div className="text-purple-500">
                    {formData.canDeleteRecipe ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)] mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Add New User
                </>
              )}
            </button>
          </form>
        </div>

        {/* Manage Users Panel */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border-slate-700/50 shadow-[0_0_20px_rgba(0,0,0,0.2)] flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">Manage Existing Users</h2>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all placeholder:text-slate-500 text-sm shadow-inner"
              placeholder="Search by username..."
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No users found.</div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="bg-[#111827]/80 border border-slate-800/80 rounded-xl p-5 flex flex-col gap-4 mb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-lg text-white flex items-center gap-2">
                        {u.username}
                        {u.id === user?.id && <span className="text-[10px] bg-purple-600/20 border border-purple-500/20 text-purple-500 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">YOU</span>}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5 tracking-wide">ID: {u.id.substring(0,8)}...</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.id === user?.id}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-600"
                      title="Delete User"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div 
                      className={`text-sm py-2 px-3 rounded-lg border font-semibold flex items-center justify-center transition-colors cursor-default ${
                        u.role === 'Admin' 
                          ? 'bg-purple-500/5 border-purple-500/20 text-purple-500' 
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                      }`}
                      title="System Role (Locked)"
                    >
                      Role: {u.role}
                    </div>
                    
                    <button 
                      onClick={() => handleToggleDeletePerm(u)}
                      className={`text-sm py-2 px-3 rounded-lg border font-semibold flex items-center justify-center transition-colors ${
                        u.can_delete_recipe 
                          ? 'bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10' 
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Toggle Delete Recipe Permission"
                    >
                      Can Delete: {u.can_delete_recipe ? 'Yes' : 'No'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

