import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, User, Server, Users, FileText, AlertTriangle, ShieldAlert,
  MapPin, X, Activity, CloudLightning, Flame, Wind, BrainCircuit,
  IndianRupee, Zap, Info, ShieldX, CheckCircle2, Play, AlertCircle, ShieldCheck,
  LogOut, Settings, ThermometerSun, Droplets
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const slideOutRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: 100, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// --- Mock Initial Data ---
const claimsData = [
  { day: "Mon", claims: 12 }, { day: "Tue", claims: 18 },
  { day: "Wed", claims: 45 }, { day: "Thu", claims: 22 },
  { day: "Fri", claims: 30 }, { day: "Sat", claims: 85 },
  { day: "Sun", claims: 32 },
];

const riskCitiesData = [
  { city: "Mumbai", score: 0.85, fill: "#EF4444" },
  { city: "Delhi", score: 0.72, fill: "#EF4444" },
  { city: "Bangalore", score: 0.45, fill: "#F97316" },
  { city: "Hyderabad", score: 0.30, fill: "#22C55E" },
  { city: "Chennai", score: 0.15, fill: "#22C55E" },
];

const initialFraudAlerts = [
  { id: 1, type: "Duplicate Claim Attempt", worker: "98214", desc: "Claim submitted twice within 5 minutes.", time: "2m ago" },
  { id: 2, type: "GPS Spoofing Detected", worker: "77543", desc: "Worker location does not match disruption zone.", time: "15m ago" },
  { id: 3, type: "Abnormal Claim Frequency", worker: "12093", desc: "4 claims submitted within one week.", time: "1h ago" },
];

const fraudAnalyticsData = [
  { category: "Duplicate Claims", count: 18 },
  { category: "GPS Spoofing", count: 7 },
  { category: "High Cl. Freq.", count: 12 },
  { category: "Cluster Activity", count: 4 },
];
const CITIES = ['Mumbai', 'Delhi', 'Hyderabad', 'Bangalore', 'Chennai'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState({ name: 'System Admin' });

  // Dropdown States
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  // Real API Weather Map States
  const [citiesWeather, setCitiesWeather] = useState([]);
  const [weatherError, setWeatherError] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('gigshield_user');
    if (!userStr) {
      navigate('/login');
    } else {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') navigate('/dashboard');
      setAdminUser(user);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('gigshield_user');
    navigate('/login');
    window.dispatchEvent(new Event('storage'));
  };

  const fetchAllCitiesWeather = async () => {
    try {
      setWeatherError(false);
      const promises = CITIES.map(c => fetch(`http://127.0.0.1:5000/api/weather?city=${c}`).then(res => {
         if(!res.ok) throw new Error('Failed');
         return res.json();
      }));
      
      const results = await Promise.all(promises);
      
      const mappedData = results.map(data => {
          let reqCity = "Unknown";
          // Re-map name to match array strictly
          const returnedName = data.name.toLowerCase();
          CITIES.forEach(c => {
            if (returnedName.includes(c.toLowerCase()) || c.toLowerCase().includes(returnedName)) {
              reqCity = c;
            }
          });

          const temp = data.main.temp;
          const rain = data.rain ? (data.rain['1h'] || 0) : 0;
          let risk = 'Low';
          let color = 'text-secondary';
          
          if (rain > 40 || temp > 42) {
              risk = 'High';
              color = 'text-alert';
          } else if (rain > 20) {
              risk = 'Medium';
              color = 'text-orange-400';
          }
          
          return {
              city: reqCity !== "Unknown" ? reqCity : data.name,
              temp: Math.round(temp) + '°C',
              rain: rain + ' mm',
              risk: risk,
              color: color,
              rawTemp: temp,
              rawRain: rain,
              rawAqi: reqCity === 'Delhi' ? 350 : 150
          };
      });
      
      // Sort to keep standard order
      const sortedData = [];
      CITIES.forEach(c => {
        const found = mappedData.find(md => md.city === c);
        if (found) sortedData.push(found);
      });

      setCitiesWeather(sortedData);
    } catch (e) {
      setWeatherError(true);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchAllCitiesWeather();
    const interval = weatherError ? 10000 : 60000;
    const intervalId = setInterval(fetchAllCitiesWeather, interval);
    return () => clearInterval(intervalId);
  }, [weatherError]);

  const [fraudAlerts, setFraudAlerts] = useState(initialFraudAlerts);
  const [liveEvents, setLiveEvents] = useState([
    { id: 1, desc: "Heavy Rain detected in Mumbai", time: "Just now", icon: CloudLightning, color: "text-blue-400" },
    { id: 2, desc: "AQI spike detected in Delhi", time: "5m ago", icon: Wind, color: "text-zinc-400" },
    { id: 3, desc: "Extreme Heat alert in Hyderabad", time: "12m ago", icon: Flame, color: "text-orange-500" },
    { id: 4, desc: "Curfew alert in Bangalore", time: "1h ago", icon: ShieldAlert, color: "text-red-500" },
  ]);

  // Simulation State
  const [simStep, setSimStep] = useState(0); 
  const [simTrigger, setSimTrigger] = useState(null);
  const [timelineLog, setTimelineLog] = useState([]);

  // Real Claims Sync
  const [recentClaims, setRecentClaims] = useState([]);

  useEffect(() => {
    const fetchClaims = () => {
      const claimsStr = localStorage.getItem('gigshield_claims');
      const usersStr = localStorage.getItem('gigshield_users');
      if (claimsStr) {
        try {
          const claims = JSON.parse(claimsStr);
          const users = usersStr ? JSON.parse(usersStr) : [];
          const enriched = claims.map(c => {
             const usr = users.find(u => String(u.id) === String(c.worker));
             return { ...c, email: usr ? usr.email : 'system@gigshield.ai' };
          });
          setRecentClaims(enriched);
        } catch(e) {}
      }
    };
    fetchClaims();
    const intervalId = setInterval(fetchClaims, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleClaimAction = (claimId, workerId, amount, action) => {
    const claimsStr = localStorage.getItem('gigshield_claims');
    if (!claimsStr) return;
    
    let claims = JSON.parse(claimsStr);
    let claimIdx = claims.findIndex(c => c.id === claimId);
    if (claimIdx !== -1) {
      claims[claimIdx].status = action === 'approve' ? 'Approved' : 'Rejected';
      localStorage.setItem('gigshield_claims', JSON.stringify(claims));
      
      const notifKey = `gigshield_notifications_${workerId}`;
      const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
      existingNotifs.push({
        id: Date.now(),
        title: action === 'approve' ? 'Claim Approved' : 'Claim Rejected',
        desc: action === 'approve' ? `₹${amount} credited` : 'Conditions not satisfied',
        type: action === 'approve' ? 'success' : 'error',
        time: 'Just now'
      });
      localStorage.setItem(notifKey, JSON.stringify(existingNotifs));
      
      setRecentClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: claims[claimIdx].status } : c));
    }
  };

  // --- Simulated AI Risk Score ---
  const rain_prob = 0.65;
  const heat_prob = 0.30;
  const poll_prob = 0.55;
  const curf_prob = 0.10;
  
  const risk_score = (rain_prob * 0.4) + (heat_prob * 0.2) + (poll_prob * 0.2) + (curf_prob * 0.2); 
  const colorZone = risk_score > 0.7 ? '#EF4444' : risk_score > 0.3 ? '#F97316' : '#22C55E';
  const colorText = risk_score > 0.7 ? 'High Risk' : risk_score > 0.3 ? 'Medium Risk' : 'Low Risk';
  
  let premium = 50 + (risk_score * 100);
  if (premium > 150) premium = 150;
  if (premium < 50) premium = 50;

  // --- Simulated Fraud Risk Score ---
  const fraud_risk_score = 42; 
  const fraudColorZone = fraud_risk_score > 70 ? '#EF4444' : fraud_risk_score > 30 ? '#F97316' : '#22C55E';
  const fraudColorText = fraud_risk_score > 70 ? 'High Risk' : fraud_risk_score > 30 ? 'Medium Risk' : 'Low Risk';

  const dismissAlert = (id) => {
    setFraudAlerts(alerts => alerts.filter(a => a.id !== id));
  };

  const handleSimulate = async (type) => {
    if (simStep > 0) return;
    
    const simConfig = {
      'rain': { name: 'Heavy Rain', desc: 'Rainfall > 40mm', city: 'Mumbai', payout: 450, icon: CloudLightning, color: "text-blue-400" },
      'heat': { name: 'Extreme Heat', desc: 'Temperature > 42°C', city: 'Delhi', payout: 350, icon: Flame, color: "text-orange-500" },
      'pollution': { name: 'Severe Pollution', desc: 'AQI > 300', city: 'Bangalore', payout: 300, icon: Wind, color: "text-zinc-400" },
      'curfew': { name: 'Curfew Event', desc: 'Delivery zone shutdown detected', city: 'Hyderabad', payout: 600, icon: ShieldAlert, color: "text-red-500" }
    };

    const conf = simConfig[type];
    setSimTrigger(conf);
    setTimelineLog([]);

    setSimStep(1);
    setTimelineLog(prev => [...prev, { label: `${conf.name} Detected`, icon: AlertCircle, active: true }]);
    setLiveEvents(prev => [{ id: Date.now(), desc: `${conf.name} detected in ${conf.city}`, time: "Just now", icon: conf.icon, color: conf.color }, ...prev]);
    
    await new Promise(r => setTimeout(r, 1500));
    setSimStep(2);
    setTimelineLog(prev => [...prev, { label: `Parametric Trigger Activated`, icon: ShieldCheck, active: true }]);
    
    await new Promise(r => setTimeout(r, 2000));
    setSimStep(3);
    setTimelineLog(prev => [...prev, { label: `Fraud Check Completed`, icon: CheckCircle2, active: true }]);

    await new Promise(r => setTimeout(r, 1500));
    setSimStep(4);
    setTimelineLog(prev => [...prev, { label: `Claim Generated`, icon: FileText, active: true }]);

    await new Promise(r => setTimeout(r, 1500));
    setSimStep(5);
    setTimelineLog(prev => [...prev, { label: `Payout Sent`, icon: IndianRupee, active: true }]);

    // Sync to Worker Dashboard
    const existingClaims = JSON.parse(localStorage.getItem('gigshield_claims') || '[]');
    existingClaims.unshift({
      id: Date.now(),
      type: conf.name,
      amount: conf.payout,
      status: 'Approved',
      date: 'Just now'
    });
    localStorage.setItem('gigshield_claims', JSON.stringify(existingClaims));

    // Also add to Admin Event Log & Admin Notification mock
    setLiveEvents(prev => [{ id: Date.now()+1, desc: `Payout ₹${conf.payout} completed for 93211`, time: "Just now", icon: IndianRupee, color: "text-secondary" }, ...prev]);

    await new Promise(r => setTimeout(r, 6000));
    setSimStep(0);
    setSimTrigger(null);
  };

  return (
    <div id="admin-dashboard" className="max-w-7xl mx-auto pb-24 relative overflow-x-hidden">
      
      {/* SUCCESS PAYOUT POPUP OVERLAY */}
      <AnimatePresence>
        {simStep === 5 && simTrigger && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-none"
          >
            <div className="bg-[#18181b] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden pointer-events-auto">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#22C55E]/20 rounded-full blur-[40px] -z-10" />
               <div className="w-16 h-16 bg-[#22C55E]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#22C55E]">
                 <CheckCircle2 className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">₹{simTrigger.payout} Compensation Successfully Credited</h3>
               <p className="text-zinc-400 text-sm mb-4">Transaction ID: TXN-8F29A1B{Math.floor(Math.random()*100)}</p>
               <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 6, ease: "linear" }} className="h-1 bg-[#22C55E] rounded-full mt-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-6 border-b border-white/10 gap-4 mt-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Control Center</h1>
          <p className="text-zinc-400 mt-1">Real-time monitoring of insured workers and disruption risks.</p>
        </div>
        <div className="flex items-center gap-4 relative">
          
          {/* SYSTEM STATUS */}
          <div id="system-health" className="relative">
            <button 
              onClick={() => { setShowSystemStatus(!showSystemStatus); setShowProfile(false); setShowNotif(false); }}
              className="flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/30 px-3 py-1.5 rounded-full hover:bg-[#22C55E]/20 transition-colors"
            >
              <Server className="w-4 h-4 text-[#22C55E]" />
              <span className="text-[#22C55E] text-sm font-semibold hidden md:block">System Operational</span>
            </button>
            {showSystemStatus && (
              <div className="absolute top-full right-0 mt-2 w-64 glass-card-premium p-4 z-50">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">System Health</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white">Backend API</span>
                    <span className="text-secondary flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Online</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white">Weather API</span>
                    <span className={`${weatherError ? 'text-red-400' : 'text-secondary'} flex items-center gap-1`}>
                      {weatherError ? <AlertCircle className="w-3 h-3"/> : <CheckCircle2 className="w-3 h-3"/>} 
                      {weatherError ? 'Offline' : 'Online'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white">Simulation Engine</span>
                    <span className="text-secondary flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotif(!showNotif); setShowProfile(false); setShowSystemStatus(false); }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
            >
              <span className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-alert shadow-[0_0_8px_rgba(249,115,22,0.8)] border-2 border-[#0B0F1A]" />
              <Bell className="w-6 h-6 text-zinc-300" />
            </button>
            {showNotif && (
              <div className="absolute top-full right-0 mt-2 w-72 glass-card-premium p-4 z-50 max-h-96 overflow-y-auto hidden-scrollbar flex flex-col gap-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Recent Notifications</h4>
                <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex gap-3 items-start">
                  <CloudLightning className="w-5 h-5 text-blue-400 shrink-0"/>
                  <div><p className="text-sm font-semibold">Heavy Rain Triggered</p><p className="text-xs text-zinc-400">Trigger active in Mumbai. 32 claims generated.</p></div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex gap-3 items-start">
                  <ShieldX className="w-5 h-5 text-alert shrink-0"/>
                  <div><p className="text-sm font-semibold">Fraud Alert Detected</p><p className="text-xs text-zinc-400">GPS spoofing identified for Worker 77543.</p></div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex gap-3 items-start">
                  <User className="w-5 h-5 text-secondary shrink-0"/>
                  <div><p className="text-sm font-semibold">New Worker Registered</p><p className="text-xs text-zinc-400">Rahul K. from Delhi joined Premium Plan.</p></div>
                </div>
              </div>
            )}
          </div>

          {/* PROFILE */}
          <div className="relative">
            <button 
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false); setShowSystemStatus(false); }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            >
              <User className="w-5 h-5 text-white" />
            </button>
            {showProfile && (
              <div className="absolute top-full right-0 mt-2 w-48 glass-card-premium py-2 z-50 flex flex-col">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold">{adminUser.name}</p>
                  <p className="text-xs text-zinc-400">Administrator</p>
                </div>
                <Link to="/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-zinc-300 w-full text-left transition-colors">
                  <Settings className="w-4 h-4"/> Settings
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 hover:bg-alert/10 text-sm text-alert w-full text-left transition-colors font-semibold">
                  <LogOut className="w-4 h-4"/> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8" onClick={() => {setShowProfile(false); setShowNotif(false); setShowSystemStatus(false);}}>
        
        {/* KEY METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Workers Insured" value="1,245" icon={Users} color="text-blue-400" />
          <MetricCard title="Active Weekly Policies" value="980" icon={FileText} color="text-secondary" />
          <MetricCard title="Claims Triggered Today" value="32" icon={Activity} color="text-primary" />
          <MetricCard title="Fraud Alerts" value="4" icon={AlertTriangle} color="text-red-400" glow />
        </div>

        {/* CITY WEATHER MAP - LIVE API */}
        <motion.div variants={fadeIn} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Regional Weather & Risk Map
          </h2>
          
          {weatherError ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-zinc-500 mb-3" />
              <p className="text-zinc-400 font-medium tracking-wide">Weather data temporarily unavailable.</p>
              <p className="text-zinc-500 text-sm mt-1">Retrying automatically...</p>
            </div>
          ) : loadingWeather || citiesWeather.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {citiesWeather.map((c, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                  <h4 className="font-bold text-sm mb-2">{c.city}</h4>
                  <div className="flex justify-center gap-4 w-full mb-3">
                    <div className="flex flex-col items-center">
                      {c.rawTemp > 42 ? <Flame className="w-5 h-5 text-alert animate-pulse mb-1"/> : <ThermometerSun className={`w-5 h-5 text-zinc-400 mb-1`}/>}
                      <span className="text-xs font-semibold">{c.temp}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <CloudLightning className={`w-5 h-5 ${c.rawRain > 40 ? 'text-alert animate-pulse' : c.rawRain > 0 ? 'text-blue-400' : 'text-zinc-400'} mb-1`}/>
                      <span className="text-xs font-semibold">{c.rain}</span>
                    </div>
                  </div>
                  <div className="mt-auto w-full pt-2 border-t border-white/5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/5 ${c.color}`}>
                      {c.risk} Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={fadeIn} className="lg:col-span-2 glass-card-premium p-6">
            <h2 className="text-lg font-bold mb-6">Weekly Claims Trend</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={claimsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} itemStyle={{ color: '#fff' }}/>
                  <Area type="monotone" dataKey="claims" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorClaims)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="glass-card-premium p-6 flex flex-col hidden-scrollbar overflow-y-auto max-h-[380px]">
            <h2 className="text-lg font-bold mb-6 flex items-center justify-between">
              Live Event Feed
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-alert"></span>
              </span>
            </h2>
            <div className="space-y-4 flex-1">
              {liveEvents.map((event) => (
                <div key={event.id} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                  <div className={`p-2 rounded-lg bg-white/5 mt-1 ${event.color}`}>
                    <event.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{event.desc}</p>
                    <p className="text-xs text-zinc-500 mt-1">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* =========================================
            PENDING CLAIM REQUESTS
        ============================================= */}
        <motion.div variants={fadeIn} className="pt-12 border-t border-white/10 mt-12 pb-12">
           <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              Pending Claim Requests
              <span className="bg-alert/20 text-alert text-sm font-semibold px-3 py-1 rounded-full">{recentClaims.filter(c => c.status === 'Checking').length} Pending</span>
           </h2>
           <div className="glass-card-premium overflow-hidden rounded-2xl mb-8">
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-semibold">
                       <tr>
                         <th className="px-6 py-4">Worker Email</th>
                         <th className="px-6 py-4">City</th>
                         <th className="px-6 py-4">Claim Reason</th>
                         <th className="px-6 py-4">Payout</th>
                         <th className="px-6 py-4">Timestamp</th>
                         <th className="px-6 py-4">Status & Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 min-h-[100px]">
                       {recentClaims.filter(c => c.status === 'Checking').length === 0 ? (
                         <tr><td colSpan="6" className="px-6 py-8 text-center text-zinc-500">No pending claims.</td></tr>
                       ) : (
                         recentClaims.filter(c => c.status === 'Checking').map((claim) => (
                           <tr key={claim.id} className="hover:bg-white/5 transition-colors">
                             <td className="px-6 py-4 font-medium text-white">{claim.email}</td>
                             <td className="px-6 py-4 text-zinc-300">{claim.city}</td>
                             <td className="px-6 py-4 font-semibold text-primary">{claim.reason || claim.type}</td>
                             <td className="px-6 py-4 font-bold text-secondary">₹{claim.amount}</td>
                             <td className="px-6 py-4 text-zinc-400">{claim.date}</td>
                             <td className="px-6 py-4 flex gap-2 items-center">
                               <span className="bg-alert/20 text-alert px-3 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider animate-pulse flex items-center gap-2"><Activity className="w-3 h-3"/> {claim.status}</span>
                             </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </motion.div>

        {/* =========================================
            RECENT CLAIMS ACTIVITY
        ============================================= */}
        <motion.div variants={fadeIn} className="pb-12">
           <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              Recent Claims Activity
              <span className="bg-secondary/20 text-secondary text-sm font-semibold px-3 py-1 rounded-full">{recentClaims.filter(c => c.status !== 'Checking').length} Claims Total</span>
           </h2>
           <div className="glass-card-premium overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-semibold">
                       <tr>
                         <th className="px-6 py-4">Worker Email</th>
                         <th className="px-6 py-4">City</th>
                         <th className="px-6 py-4">Claim Reason</th>
                         <th className="px-6 py-4">Payout</th>
                         <th className="px-6 py-4">Timestamp</th>
                         <th className="px-6 py-4">Status & Details</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 min-h-[100px]">
                       {recentClaims.filter(c => c.status !== 'Checking').length === 0 ? (
                         <tr><td colSpan="6" className="px-6 py-8 text-center text-zinc-500">No active claims found.</td></tr>
                       ) : (
                         recentClaims.filter(c => c.status !== 'Checking').map((claim) => (
                           <tr key={claim.id} className="hover:bg-white/5 transition-colors">
                             <td className="px-6 py-4 font-medium text-white">{claim.email}</td>
                             <td className="px-6 py-4 text-zinc-300">{claim.city}</td>
                             <td className="px-6 py-4 font-semibold text-primary">{claim.reason || claim.type}</td>
                             <td className="px-6 py-4 font-bold text-secondary">₹{claim.amount}</td>
                             <td className="px-6 py-4 text-zinc-400">{claim.date}</td>
                             <td className="px-6 py-4">
                               <div className="flex flex-col gap-1 items-start">
                                 <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 inline-flex items-center justify-center rounded-md ${
                                   claim.status === 'Approved' ? 'bg-secondary/20 text-secondary' : 'bg-red-500/20 text-red-400'
                                 }`}>
                                   {claim.status}
                                 </span>
                                 {claim.response && <span className="text-xs text-zinc-500 max-w-xs truncate" title={claim.response}>{claim.response}</span>}
                               </div>
                             </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </motion.div>

        {/* =========================================
            DISRUPTION SIMULATION ENGINE SECTION
        ============================================= */}
        <motion.div variants={fadeIn} className="pt-12 border-t border-white/10 mt-12 pb-12">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-secondary/20 rounded-xl text-secondary"><Play className="w-8 h-8" /></div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Disruption Simulation Engine</h2>
            <p className="text-zinc-400">
              Simulate real-world disruptions to demonstrate automated parametric insurance payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <motion.div variants={fadeIn} className="glass-card-premium p-8 lg:col-span-5 flex flex-col justify-center">
              <h3 className="text-lg font-bold mb-6">Launch Simulation</h3>
              <div className="space-y-4">
                <button disabled={simStep > 0} onClick={() => handleSimulate('rain')} className="w-full flex justify-between items-center bg-[#6366F1] text-white px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none">
                  <span className="flex items-center gap-3"><CloudLightning className="w-5 h-5"/> Simulate Heavy Rain</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">Rainfall &gt; 40mm</span>
                </button>
                <button disabled={simStep > 0} onClick={() => handleSimulate('heat')} className="w-full flex justify-between items-center bg-[#6366F1] text-white px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none">
                  <span className="flex items-center gap-3"><Flame className="w-5 h-5"/> Simulate Extreme Heat</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">Temp &gt; 42°C</span>
                </button>
                <button disabled={simStep > 0} onClick={() => handleSimulate('pollution')} className="w-full flex justify-between items-center bg-[#6366F1] text-white px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none">
                  <span className="flex items-center gap-3"><Wind className="w-5 h-5"/> Simulate Severe Pollution</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">AQI &gt; 300</span>
                </button>
                <button disabled={simStep > 0} onClick={() => handleSimulate('curfew')} className="w-full flex justify-between items-center bg-[#6366F1] text-white px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none">
                  <span className="flex items-center gap-3"><ShieldAlert className="w-5 h-5"/> Simulate Curfew Event</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">Zone shutdown</span>
                </button>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="glass-card-premium p-8 lg:col-span-7 relative overflow-hidden flex flex-col min-h-[400px]">
               <h3 className="text-lg font-bold mb-8">Automated Claim Flow</h3>
               {simStep === 0 && (
                 <div className="flex-1 flex flex-col justify-center items-center text-zinc-500">
                   <Activity className="w-12 h-12 mb-4 opacity-30" />
                   <p>Waiting for disruption simulation to start...</p>
                 </div>
               )}
               {simStep > 0 && simTrigger && (
                 <div className="flex-1 flex flex-col">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 flex-1">
                     <div className="space-y-4">
                        <AnimatePresence>
                          {simStep >= 1 && (
                            <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                              <p className="text-xs text-secondary font-bold mb-1 uppercase tracking-wider">Step 1: Event Alert</p>
                              <p className="text-sm font-semibold">{simTrigger.name} detected in {simTrigger.city}</p>
                            </motion.div>
                          )}
                          {simStep >= 2 && (
                            <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="bg-primary/20 border border-primary/30 p-4 rounded-xl">
                              <p className="text-xs text-primary font-bold mb-1 uppercase tracking-wider">Step 2: System Message</p>
                              <p className="text-sm font-semibold">Parametric Trigger Activated</p>
                              <p className="text-xs text-primary/80 mt-1">{simTrigger.desc} threshold exceeded.</p>
                            </motion.div>
                          )}
                          {simStep >= 3 && (
                            <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                              <p className="text-xs text-zinc-400 font-bold mb-1 uppercase tracking-wider">Step 3: Fraud Check</p>
                              <div className="text-xs text-zinc-300 space-y-1 mt-2">
                                <p className="flex justify-between"><span>Verifying worker location...</span><CheckCircle2 className="w-3 h-3 text-secondary"/></p>
                                <p className="flex justify-between"><span>Checking claim duplication...</span><CheckCircle2 className="w-3 h-3 text-secondary"/></p>
                                <p className="flex justify-between"><span>Analyzing claim frequency...</span><CheckCircle2 className="w-3 h-3 text-secondary"/></p>
                              </div>
                              <p className="text-sm font-semibold text-secondary mt-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Fraud Check Passed</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                     <div className="relative">
                        <AnimatePresence>
                          {simStep >= 4 && (
                            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="absolute inset-x-0 p-1 bg-gradient-to-br from-primary via-secondary to-primary rounded-xl overflow-hidden shadow-2xl">
                              <div className="bg-[#0B0F1A] rounded-lg w-full p-6 flex flex-col justify-center">
                                <p className="text-xs text-primary font-bold mb-4 uppercase tracking-wider text-center">Step 4: Claim Generation</p>
                                <div className="space-y-4">
                                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-zinc-400">Worker ID</span><span className="font-mono font-bold text-white">93211</span></div>
                                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-zinc-400">Trigger Type</span><span className="font-bold text-white flex items-center gap-2"><simTrigger.icon className="w-4 h-4 text-primary"/> {simTrigger.name}</span></div>
                                  <div className="flex justify-between pt-2"><span className="text-zinc-400">Payout Amount</span><span className="font-bold text-2xl text-secondary">₹{simTrigger.payout}</span></div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                   </div>
                   <div className="pt-6 border-t border-white/10 mt-auto">
                     <div className="flex justify-between relative max-w-2xl mx-auto">
                        <div className="absolute top-4 left-[5%] right-[5%] h-[2px] bg-white/10 -z-10" />
                        {timelineLog.map((log, index) => (
                           <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} key={index} className="flex flex-col items-center">
                             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(99,102,241,0.5)]"><log.icon className="w-4 h-4 text-white" /></div><p className="text-[10px] text-white font-medium text-center w-20">{log.label}</p>
                           </motion.div>
                        ))}
                     </div>
                   </div>
                 </div>
               )}
            </motion.div>
          </div>
        </motion.div>

        {/* =========================================
            AI RISK ENGINE SECTION
        ============================================= */}
        <motion.div id="risk-monitor" variants={fadeIn} className="pt-12 border-t border-white/10 mt-12 pb-12">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <div className="flex justify-center mb-4"><div className="p-3 bg-primary/20 rounded-xl text-primary"><BrainCircuit className="w-8 h-8" /></div></div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">AI Risk Engine</h2><p className="text-zinc-400">Machine learning model predicting disruption risk and weekly premium pricing.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={fadeIn} className="glass-card-premium p-8 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px] -z-10" />
               <h3 className="text-lg font-bold mb-6 w-full text-center">Global Risk Score</h3>
               <div className="relative w-48 h-48 mb-6">
                 <svg className="w-full h-full transform -rotate-90">
                   <circle cx="96" cy="96" r="80" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                   <motion.circle cx="96" cy="96" r="80" fill="transparent" stroke={colorZone} strokeWidth="12" strokeLinecap="round" strokeDasharray="502" initial={{ strokeDashoffset: 502 }} animate={{ strokeDashoffset: 502 - (502 * risk_score) }} transition={{ duration: 1.5, ease: "easeOut" }}/>
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-bold text-white">{risk_score.toFixed(2)}</span><span className="text-xs font-semibold px-2 py-1 rounded mt-2 bg-white/5" style={{ color: colorZone }}>{colorText}</span></div>
               </div>
               <div className="w-full bg-primary/10 border border-primary/20 rounded-xl p-6 text-center mt-auto"><p className="text-primary font-semibold text-sm mb-2 flex justify-center items-center gap-2"><Zap className="w-4 h-4"/> Predicted Weekly Premium</p><div className="text-4xl font-bold text-white flex items-center justify-center"><IndianRupee className="w-8 h-8"/> {premium.toFixed(0)}</div><p className="text-xs text-zinc-400 mt-2">Dynamic threshold: ₹50 - ₹150</p></div>
            </motion.div>
            
            <motion.div variants={fadeIn} className="glass-card-premium p-8 lg:col-span-1">
              <h3 className="text-lg font-bold mb-8">Disruption Probability (Next 7 Days)</h3>
              <div className="space-y-6">
                 <PredictionBar label="Heavy Rain Probability" prob={rain_prob * 100} color="bg-blue-400" />
                 <PredictionBar label="Severe Pollution Probability" prob={poll_prob * 100} color="bg-zinc-400" />
                 <PredictionBar label="Extreme Heat Probability" prob={heat_prob * 100} color="bg-orange-500" />
                 <PredictionBar label="Curfew Probability" prob={curf_prob * 100} color="bg-red-500" />
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="lg:col-span-1 flex flex-col gap-6">
              <div className="glass-card-premium p-6 flex-1">
                <h3 className="text-md font-bold mb-4">Regional AI Risk Benchmarks</h3>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskCitiesData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="city" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#27272a', opacity: 0.4}} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}/>
                      <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500}>{riskCitiesData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card-premium p-6 border-primary/20 bg-primary/5">
                <h3 className="text-md font-bold mb-3 flex items-center gap-2"><Info className="w-5 h-5 text-primary"/> How Our AI Protects Gig Workers</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">GigShield AI uses predictive analytics to estimate disruption risks in each delivery zone. By analyzing environmental conditions, the platform dynamically adjusts weekly premiums.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* =========================================
            AI FRAUD DETECTION ENGINE SECTION
        ============================================= */}
        <motion.div id="fraud-detection" variants={fadeIn} className="pt-12 border-t border-white/10 mt-12 mb-12">
          <div className="mb-10 text-center max-w-2xl mx-auto"><div className="flex justify-center mb-4"><div className="p-3 bg-red-400/20 rounded-xl text-red-400"><ShieldX className="w-8 h-8" /></div></div><h2 className="text-3xl font-bold tracking-tight mb-3">AI Fraud Detection Engine</h2><p className="text-zinc-400">Automated monitoring system that detects suspicious claim behavior among insured workers.</p><p className="text-sm text-zinc-500 mt-4 leading-relaxed bg-white/5 p-4 rounded-xl">The GigShield AI Fraud Detection Engine analyzes claim patterns, location data, and behavioral anomalies to prevent fraudulent payouts and protect the sustainability of the insurance system.</p></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={fadeIn} className="glass-card-premium p-8 lg:col-span-1 flex flex-col h-[400px]">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">Live Fraud Monitoring</h3>
               <div className="space-y-4 flex-1 overflow-y-auto hidden-scrollbar relative pr-2">
                 <AnimatePresence>
                   {fraudAlerts.length === 0 ? (
                     <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center text-zinc-500 mt-10">No active fraud alerts. System secure.</motion.div>
                   ) : (
                     fraudAlerts.map((alert) => (
                       <motion.div key={alert.id} variants={slideOutRight} initial="hidden" animate="visible" exit="exit" layout whileHover={{ x: 4, boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)" }} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] border-l-4 border-l-[#EF4444] rounded-r-xl rounded-l-md p-4 flex gap-3 relative transition-all duration-300">
                         <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                         <div className="flex-1 pr-6"><p className="text-sm font-bold text-white">{alert.type}</p><p className="text-xs text-zinc-400 mt-1 mb-2">Worker ID: <span className="text-primary font-mono">{alert.worker}</span></p><p className="text-xs text-red-200/80 bg-red-500/10 p-2 rounded-lg">{alert.desc}</p></div>
                         <button onClick={() => dismissAlert(alert.id)} className="p-2 hover:bg-white/10 rounded-lg absolute top-2 right-2 transition-colors"><X className="w-4 h-4 text-zinc-400 hover:text-white" /></button>
                       </motion.div>
                     ))
                   )}
                 </AnimatePresence>
               </div>
            </motion.div>

            <motion.div variants={fadeIn} className="lg:col-span-1 flex flex-col gap-6">
              <div className="glass-card-premium p-8 flex flex-col items-center justify-center relative overflow-hidden h-64">
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-[50px] -z-10" />
                 <h3 className="text-lg font-bold mb-4 w-full text-center">System Threat Level</h3>
                 <div className="relative w-40 h-40">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="80" cy="80" r="65" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                     <motion.circle cx="80" cy="80" r="65" fill="transparent" stroke={fraudColorZone} strokeWidth="10" strokeLinecap="round" strokeDasharray="408" initial={{ strokeDashoffset: 408 }} animate={{ strokeDashoffset: 408 - (408 * (fraud_risk_score / 100)) }} transition={{ duration: 1.5, ease: "easeOut" }}/>
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold text-white">{fraud_risk_score}</span><span className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">Out of 100</span></div>
                 </div>
                 <span className="text-xs font-semibold px-3 py-1.5 rounded-full mt-auto bg-white/5" style={{ color: fraudColorZone }}>{fraudColorText}</span>
              </div>
              <div className="glass-card-premium p-6 flex-1">
                <h3 className="text-sm font-bold mb-4 text-zinc-300">Active Fraud Rules</h3>
                <ul className="space-y-3 text-xs text-zinc-400">
                  <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-primary shrink-0"/><span><strong className="text-white">Rule 1:</strong> If &gt;3 claims in 1 week → flag frequency.</span></li>
                  <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-primary shrink-0"/><span><strong className="text-white">Rule 2:</strong> If GPS outside disruption zone → flag mismatch.</span></li>
                  <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-primary shrink-0"/><span><strong className="text-white">Rule 3:</strong> If duplicate claim &lt;10 mins → flag duplicate.</span></li>
                  <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-primary shrink-0"/><span><strong className="text-white">Rule 4:</strong> If identical GPS cluster → flag activity.</span></li>
                </ul>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="glass-card-premium p-8 lg:col-span-1">
              <h3 className="text-xl font-bold mb-8">Fraud Alerts This Week</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fraudAnalyticsData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="category" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#a1a1aa'}} interval={0} />
                    <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#27272a', opacity: 0.4}} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}/>
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1500}>{fraudAnalyticsData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 0 ? "#EF4444" : "#6366F1"} />))}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

// --- Subcomponents ---

function MetricCard({ title, value, icon: Icon, color, glow }) {
  return (
    <motion.div variants={fadeIn} whileHover={{ y: -6, boxShadow: glow ? "0 10px 30px rgba(239,68,68,0.15)" : "0 10px 30px rgba(0,0,0,0.3)" }} className={`glass-card-premium p-6 flex items-center gap-4 transition-all duration-300 ${glow ? 'border-red-400/30 ring-1 ring-red-400/10' : ''}`}>
      <div className={`p-4 rounded-xl bg-white/5 ${color}`}><Icon className="w-8 h-8" /></div>
      <div><p className="text-zinc-400 text-sm font-medium">{title}</p><p className="text-2xl md:text-3xl font-bold mt-1 text-white">{value}</p></div>
    </motion.div>
  );
}

function PredictionBar({ label, prob, color }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-2"><span className="text-sm font-medium text-zinc-300">{label}</span><span className="text-sm font-bold">{prob}%</span></div>
      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${prob}%` }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeOut"}} className={`h-full ${color}`} />
      </div>
    </div>
  );
}
