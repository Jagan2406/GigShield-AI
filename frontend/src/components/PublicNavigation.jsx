import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function PublicNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-card mx-4 mt-4 mb-8 px-6 py-4 flex items-center justify-between">
      <div 
        onClick={() => scrollToSection('hero')} 
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">GigShield<span className="text-primary">AI</span></span>
      </div>
      
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
    </nav>
  );
}
