import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, UserCog, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.message === 'Login successful') {
        // Build session according to existing logic in app
        const sessionData = {
          user_id: data.role === 'admin' ? 'admin_001' : 'usr_' + Math.floor(Math.random() * 10000), // mock ID since backend doesn't return one right now
          role: data.role,
          email: data.email,
          name: data.role === 'admin' ? "System Admin" : "User", // Mock since the endpoint doesn't return a name
          city: "Hyderabad" // mock since endpoint doesn't return
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionData));
        localStorage.setItem('gigshield_user', JSON.stringify(sessionData)); // keeping original compatibility too
        window.dispatchEvent(new Event('storage'));

        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please check your backend.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-premium p-8 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-zinc-400 text-sm mt-1">Sign in to your GigShield AI account</p>
        </div>

        {error && (
          <div className="mb-6 bg-alert/10 border border-alert/30 text-alert p-3 rounded-lg flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="partner@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>


          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] mt-2"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          New to GigShield? <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold">Create account</Link>
        </p>
      </motion.div>
    </div>
  );
}
