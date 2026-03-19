import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings, LogOut, HeartPulse, ShieldAlert, CloudLightning } from 'lucide-react';

export default function AdminNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('gigshield_user');
    navigate('/login');
    window.dispatchEvent(new Event('storage'));
  };

  const isActive = (path) => location.pathname === path ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5";

  // If we are passing hashes down or doing a dedicated page, we default to /admin for these if they are hashes.
  const routeToAdminHash = (id) => {
    if (location.pathname !== '/admin') {
      navigate('/admin');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-card mx-4 mt-4 mb-4 px-6 py-4 flex items-center justify-between">
      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight hidden sm:block">Admin<span className="text-primary">Console</span></span>
      </Link>

      <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center md:justify-end pr-4">
        <button onClick={() => routeToAdminHash('admin-dashboard')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors text-zinc-400 hover:text-white hover:bg-white/5`}>
          <LayoutDashboard className="w-4 h-4"/> <span className="hidden xl:block">Admin Dashboard</span>
        </button>
        <button onClick={() => routeToAdminHash('risk-monitor')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors text-zinc-400 hover:text-white hover:bg-white/5`}>
          <CloudLightning className="w-4 h-4"/> <span className="hidden xl:block">Risk Monitor</span>
        </button>
        <button onClick={() => routeToAdminHash('fraud-detection')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors text-zinc-400 hover:text-white hover:bg-white/5`}>
          <ShieldAlert className="w-4 h-4"/> <span className="hidden xl:block">Fraud Alerts</span>
        </button>
        <button onClick={() => routeToAdminHash('system-health')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors text-zinc-400 hover:text-white hover:bg-white/5`}>
          <HeartPulse className="w-4 h-4"/> <span className="hidden xl:block">System Health</span>
        </button>
        <Link to="/settings" className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${isActive('/settings')}`}>
          <Settings className="w-4 h-4"/> <span className="hidden xl:block">Settings</span>
        </Link>
      </div>

      <button onClick={handleLogout} className="flex items-center gap-2 bg-white/5 hover:bg-alert/10 hover:text-alert border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
        <LogOut className="w-4 h-4" /> <span className="hidden sm:block">Logout</span>
      </button>
    </nav>
  );
}
