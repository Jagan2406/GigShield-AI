import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User, MapPin, AlertCircle } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: 'Hyderabad'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.email === 'admin@gigshield.ai') {
      setError('Cannot register with reserved system admin email.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          city: formData.city
        })
      });

      const data = await response.json();

      if (response.ok && data.message === 'Signup successful') {
        alert('Signup successful');
        navigate('/login');
      } else if (data.message === 'User already exists') {
        setError('User already exists');
      } else {
        setError(data.message || 'An error occurred during signup');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again later.');
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-premium p-8 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
          <p className="text-zinc-400 text-sm mt-1">Join GigShield AI for income protection</p>
        </div>

        {error && (
          <div className="mb-6 bg-alert/10 border border-alert/30 text-alert p-3 rounded-lg flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                name="name" type="text" required onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Rahul Kumar"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                name="email" type="email" required onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="partner@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Operating City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
              <select 
                name="city" value={formData.city} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="Delhi" className="bg-[#0B0F1A]">Delhi</option>
                <option value="Mumbai" className="bg-[#0B0F1A]">Mumbai</option>
                <option value="Hyderabad" className="bg-[#0B0F1A]">Hyderabad</option>
                <option value="Bangalore" className="bg-[#0B0F1A]">Bangalore</option>
                <option value="Chennai" className="bg-[#0B0F1A]">Chennai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                name="password" type="password" required onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-secondary hover:bg-secondary/90 text-white py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] mt-4"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-secondary hover:text-secondary/80 font-semibold">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
