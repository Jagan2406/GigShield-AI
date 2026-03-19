import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, ShieldCheck, LogOut, Settings as SettingsIcon } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('gigshield_user');
    if (!sessionData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(sessionData);
    setUser(parsedUser);

    const planData = localStorage.getItem('gigshield_plan');
    if (planData) {
      setPlan(JSON.parse(planData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('gigshield_user');
    navigate('/login');
    window.dispatchEvent(new Event('storage'));
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto pb-24 relative overflow-x-hidden pt-12 px-4">
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] -z-10" />
      
      <header className="flex items-center gap-3 border-b border-white/10 pb-6 mb-8">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-zinc-400 mt-1">Manage your profile and coverage options.</p>
        </div>
      </header>

      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="glass-card-premium p-8 flex flex-col gap-8">
        
        {/* Profile Section */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-secondary"/> Personal Details</h2>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
              <span className="text-zinc-400 text-sm">Full Name</span>
              <span className="font-semibold text-white">{user.name}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
              <span className="text-zinc-400 text-sm">Email Address</span>
              <span className="font-semibold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-500"/>
                {user.email || 'partner@example.com'}
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <span className="text-zinc-400 text-sm">Role</span>
              <span className="font-semibold text-white capitalize bg-white/10 px-3 py-1 rounded-full text-xs tracking-wider">
                {user.role}
              </span>
            </div>
          </div>
        </section>

        {/* Plan Section */}
        {user.role === 'worker' && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary"/> Coverage Plan</h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
              {plan ? (
                <>
                  <div>
                    <span className="text-zinc-400 text-sm block mb-1">Current Active Plan</span>
                    <span className="font-bold text-lg text-primary">{plan.plan}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 text-sm block mb-1">Weekly Premium</span>
                    <span className="font-bold text-white">₹{plan.weekly_cost}</span>
                  </div>
                </>
              ) : (
                <div className="text-zinc-400">No active coverage plan selected.</div>
              )}
            </div>
          </section>
        )}

        {/* Action Section */}
        <section className="pt-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-alert/10 text-alert hover:bg-alert/20 border border-alert/20 font-bold transition-colors w-full sm:w-auto justify-center"
          >
            <LogOut className="w-5 h-5" />
            Sign Out Securely
          </button>
        </section>

      </motion.div>
    </div>
  );
}
