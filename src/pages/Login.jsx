import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../services/supabase';
import { Lock, User, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to intended page or dashboard
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Username and password are required.');
      return;
    }
    
    setLoading(true);
    try {
      await login(formData.username, formData.password);
      // Navigation happens automatically via useEffect
    } catch (err) {
      setError(err.message || 'Login failed. If this is your first time, login with admin/admin to initialize.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
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
      const res = await mockDb.registerAdmin(formData.username, formData.password, user?.id);
      if (res.error) throw res.error;
      
      setSuccess(`Admin user '${formData.username}' created successfully! You can now log in.`);
      setFormData({ username: '', password: '', confirmPassword: '' });
      setActiveTab('signin');
    } catch (err) {
      setError(err.message || 'Failed to register admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in p-4">
      <div className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(230,81,0,0.1)] relative">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
            className={`flex-1 py-4 text-center font-semibold text-sm tracking-wider uppercase transition-colors ${
              activeTab === 'signin' 
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}
            className={`flex-1 py-4 text-center font-semibold text-sm tracking-wider uppercase transition-colors ${
              activeTab === 'signup' 
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Admin'}
            </h2>
            <p className="text-slate-400 text-sm">
              {activeTab === 'signin' 
                ? 'Sign in to manage your recipes and costs.' 
                : 'Register a new admin user (requires authorization).'}
            </p>
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

          <form onSubmit={activeTab === 'signin' ? handleLogin : handleRegister} className="space-y-5">
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
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {activeTab === 'signup' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Retype Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-500"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(230,81,0,0.3)] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : activeTab === 'signin' ? (
                <>
                  <LogIn className="w-5 h-5" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Create Admin User
                </>
              )}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
