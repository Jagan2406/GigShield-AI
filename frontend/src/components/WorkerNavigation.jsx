import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings, Bell, LogOut, Home } from 'lucide-react';

export default function WorkerNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('gigshield_user');
    navigate('/login');
    window.dispatchEvent(new Event('storage'));
  };

  const isActive = (path) => location.pathname === path ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5";

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-card mx-4 mt-4 mb-4 px-6 py-4 flex items-center justify-between">
      <div onClick={() => scrollToSection('hero')} className="flex items-center gap-2 cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight hidden sm:block">GigShield<span className="text-primary">AI</span></span>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center md:justify-end pr-4">
        <button onClick={() => scrollToSection('hero')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors text-zinc-400 hover:text-white hover:bg-white/5`}>
           <span className="hidden md:block">Home</span>
        </button>
        <button onClick={() => scrollToSection('how-it-works')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors text-zinc-400 hover:text-white hover:bg-white/5`}>
           <span className="hidden md:block">How It Works</span>
        </button>
        <button onClick={() => scrollToSection('pricing')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors text-zinc-400 hover:text-white hover:bg-white/5`}>
           <span className="hidden md:block">Weekly Pricing</span>
        </button>
        <Link to="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${isActive('/dashboard')}`}>
          <LayoutDashboard className="w-4 h-4"/> <span className="hidden md:block">Dashboard</span>
        </Link>
      </div>

      <button onClick={handleLogout} className="flex items-center gap-2 bg-white/5 hover:bg-alert/10 hover:text-alert border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
        <LogOut className="w-4 h-4" /> <span className="hidden sm:block">Logout</span>
      </button>
    </nav>
  );
}
