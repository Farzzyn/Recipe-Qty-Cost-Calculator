import { useState } from 'react';
import { Shield, UserPlus, Lock, User, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../services/supabase';

export default function AdminSettings() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '',
    role: 'User', // 'User' or 'Admin'
    canDeleteRecipe: false
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
        formData.role, 
        formData.canDeleteRecipe,
        user?.id
      );
      
      if (res.error) throw res.error;
      
      setSuccess(`User '${formData.username}' created successfully as ${formData.role}!`);
      setFormData({ 
        username: '', 
        password: '', 
        confirmPassword: '', 
        role: 'User', 
        canDeleteRecipe: false 
      });
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Shield className="w-8 h-8 text-orange-500" /> Admin Settings
        </h1>
        <p className="text-slate-400">Manage internal users and role-based access controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create User Form */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border-orange-500/20 shadow-[0_0_20px_rgba(230,81,0,0.05)]">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
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
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
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
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-500"
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
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-500"
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
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-500"
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
                    <p className="text-xs text-slate-500">Determine baseline access level</p>
                  </div>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2"
                  >
                    <option value="User">Standard User</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div 
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 cursor-pointer hover:border-orange-500/30 transition-colors"
                  onClick={() => setFormData(prev => ({ ...prev, canDeleteRecipe: !prev.canDeleteRecipe }))}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">Grant Delete Permission</p>
                    <p className="text-xs text-slate-500">Allow user to permanently delete recipes</p>
                  </div>
                  <div className="text-orange-500">
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
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(230,81,0,0.3)] mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
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

        {/* Info Panel */}
        <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center">
           <Shield className="w-20 h-20 text-orange-500/20 mb-6" />
           <h3 className="text-xl font-bold text-slate-200 mb-4">Security Guidelines</h3>
           <ul className="text-slate-400 text-sm space-y-3 text-left">
             <li className="flex items-start gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
               <span>Passwords are securely hashed before being stored in the database.</span>
             </li>
             <li className="flex items-start gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
               <span>Standard Users have read/write access but cannot delete formulas by default.</span>
             </li>
             <li className="flex items-start gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
               <span>Administrators have global access, including the ability to provision new users on this panel.</span>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
}
