import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Upload, Calculator } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Add Recipe', path: '/recipe/new', icon: <PlusSquare className="w-5 h-5" /> },
    { name: 'Upload Recipe', path: '/upload', icon: <Upload className="w-5 h-5" /> }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass border-r border-slate-800 flex flex-col hidden md:flex print:hidden">
        <div className="p-6 flex items-center gap-3">
          <img src="/logo.png" alt="ScaleCraft Logo" className="w-14 h-14 rounded-full border-2 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.25)] object-cover flex-shrink-0" />
          <div className="flex flex-col justify-center">
            <img src="/title_logo.png" alt="SCALECRAFT Logo" className="app-title-logo" />
            <p className="text-xs mt-0.5 uppercase tracking-wider font-semibold" style={{ color: '#E0E0E0' }}>Recipe Calculator</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden glass border-b border-slate-800 p-4 flex justify-between items-center z-10 print:hidden">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ScaleCraft Logo" className="w-12 h-12 rounded-full border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.25)] object-cover" />
            <img src="/title_logo.png" alt="SCALECRAFT Logo" className="app-title-logo w-28 h-8" />
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400">
            {isMobileMenuOpen ? 'Close' : 'Menu'}
          </button>
        </header>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <nav className="md:hidden glass border-b border-slate-800 p-4 absolute top-[81px] left-0 right-0 z-20 flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none print:hidden" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-900/10 blur-[120px] pointer-events-none print:hidden" />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 custom-scrollbar print:p-0 print:overflow-visible">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
