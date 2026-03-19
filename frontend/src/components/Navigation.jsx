import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings, User, Bell, LogOut, HeartPulse, ShieldAlert, CloudLightning } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('gigshield_user');
      setUser(stored ? JSON.parse(stored) : null);
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('gigshield_user');
    setUser(null);
    navigate('/login');
    window.dispatchEvent(new Event('storage'));
  };

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAdminSection = (id) => {
    if (location.pathname !== '/admin') {
      navigate('/admin');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-card mx-4 mt-4 mb-8 px-6 py-4 flex items-center justify-between">
      <div 
        onClick={() => {
           if (!user) scrollToSection('hero');
           else if (user.role === 'admin') navigate('/admin');
           else navigate('/dashboard');
        }} 
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">GigShield<span className="text-primary">AI</span></span>
      </div>
      
      {/* PUBLIC NAVIGATION */}
      {!user && (
        <>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('hero')} className="text-zinc-400 hover:text-white font-medium text-sm transition-colors">Home</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-zinc-400 hover:text-white font-medium text-sm transition-colors">How It Works</button>
            <button onClick={() => scrollToSection('pricing')} className="text-zinc-400 hover:text-white font-medium text-sm transition-colors">Weekly Pricing</button>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-zinc-400 hover:text-white font-semibold text-sm transition-colors">Login</Link>
            <Link to="/signup" className="hidden sm:flex bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              Signup
            </Link>
          </div>
        </>
      )}

      {/* WORKER NAVIGATION */}
      {user?.role === 'worker' && (
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Dashboard</Link>
            <Link to="/dashboard" className="text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"><Bell className="w-4 h-4"/> Notifications</Link>
            <Link to="/settings" className="text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"><Settings className="w-4 h-4"/> Settings</Link>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}

      {/* ADMIN NAVIGATION */}
      {user?.role === 'admin' && (
        <div className="flex items-center gap-6">
          <div className="hidden xl:flex items-center gap-6">
            <button onClick={() => scrollToAdminSection('admin-dashboard')} className="text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Admin Dashboard</button>
            <button onClick={() => scrollToAdminSection('risk-monitor')} className="text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"><CloudLightning className="w-4 h-4"/> Risk Monitor</button>
            <button onClick={() => scrollToAdminSection('fraud-detection')} className="text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Fraud Detection</button>
            <button onClick={() => scrollToAdminSection('system-health')} className="text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"><HeartPulse className="w-4 h-4"/> System Health</button>
            <Link to="/settings" className="text-zinc-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"><Settings className="w-4 h-4"/> Settings</Link>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
