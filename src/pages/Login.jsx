import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
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

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in p-4">
      
      {/* App Branding */}
      <div className="flex flex-col items-center mb-8 gap-3">
        <img src="/logo.svg" alt="RG Logo" className="h-20 w-auto object-contain drop-shadow-xl" />
        <div className="flex flex-col justify-center mt-1">
          <h1 className="text-3xl font-black text-red-500 tracking-tight leading-none pt-1">RG</h1>
          <p className="text-sm mt-1 uppercase tracking-wider font-semibold text-slate-300">Recipe Calculator</p>
        </div>
      </div>

      <div className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(147,51,234,0.1)] relative">
        <div className="p-8 border-t-4 border-purple-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-slate-400 text-sm">
              Sign in to manage your recipes and costs.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" /> Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

