import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Settings, User, ShieldCheck, IndianRupee, CloudLightning,
  Flame, Wind, CheckCircle2, AlertCircle, MapPin,
  ThermometerSun, Droplets, CloudRain, ShieldX
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const PLAN_DATA = {
  Basic: { name: 'Basic Plan', price: 20, coverage: 300 },
  Standard: { name: 'Standard Plan', price: 35, coverage: 600 },
  Premium: { name: 'Premium Plan', price: 50, coverage: 1000 }
};

export default function WorkerDashboard() {
  const [hasTrigger, setHasTrigger] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // States
  const [city, setCity] = useState('Hyderabad');
  const [weatherData, setWeatherData] = useState(null);
  const [weatherError, setWeatherError] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [recentClaims, setRecentClaims] = useState([]);

  // Claim Form State
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimReason, setClaimReason] = useState("");

  // UI States
  const [showNotif, setShowNotif] = useState(false);

  // Dynamic Notifications array
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Heavy Rain detected in Mumbai', desc: 'Active parametric trigger detected in this zone.', icon: CloudLightning, color: 'text-blue-400', time: '1m ago' },
    { id: 2, title: 'New worker registered', desc: 'A new delivery partner joined your fleet.', icon: User, color: 'text-secondary', time: '5m ago' },
    { id: 3, title: 'Claim triggered for worker ID 1043', desc: '₹450 payout successful.', icon: IndianRupee, color: 'text-yellow-400', time: '10m ago' },
    { id: 4, title: 'Fraud alert detected', desc: 'GPS mismatch isolated.', icon: ShieldX, color: 'text-alert', time: '1h ago' },
  ]);

  // Handle Auth and Plan Load
  useEffect(() => {
    const rawUser = localStorage.getItem('gigshield_user');
    if (!rawUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(rawUser);
    setUser(parsedUser);
    if (parsedUser.city) setCity(parsedUser.city);

    const rawPlan = localStorage.getItem('gigshield_plan');
    if (rawPlan) setActivePlan(JSON.parse(rawPlan));
  }, [navigate]);

  // Fetch real Dashboard Data
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/dashboard/${user.email}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const data = await res.json();

      setRecentClaims(data.claims || data.recent_claims || []);
      setNotifications(data.notifications || data.recent_notifications || []);
      if (data.worker) {
        // Safe mapping if we ever merge worker state directly, 
        // skipped for now to rely on user token natively.
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(intervalId);
  }, [user]);

  // Fetch Real Weather Data
  const fetchWeather = async (cityName = city) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/weather?city=${cityName}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();

      let finalAqi = 50;
      if (data.coord) {
        const aqiRes = await fetch(`http://127.0.0.1:5000/api/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}`);
        if (aqiRes.ok) {
          const aqiData = await aqiRes.json();
          if (aqiData.list && aqiData.list.length > 0) {
            const aqiIndex = aqiData.list[0].main.aqi;
            const aqiMap = { 1: 50, 2: 100, 3: 200, 4: 300, 5: 400 };
            finalAqi = aqiMap[aqiIndex] || 50;
          }
        }
      }

      setWeatherData({
        temp: data.main.temp,
        humidity: data.main.humidity,
        rain: data.rain ? (data.rain['1h'] || 0) : 0,
        wind: data.wind ? data.wind.speed : 0,
        desc: data.weather[0].main,
        aqi: finalAqi
      });
      setWeatherError(false);
    } catch (err) {
      setWeatherError(true);
      setWeatherData(null);
    }
  };

  useEffect(() => {
    fetchWeather();
    // 10s retry if error, 60s normal
    const interval = weatherError ? 10000 : 60000;
    const intervalId = setInterval(fetchWeather, interval);
    return () => clearInterval(intervalId);
  }, [city, weatherError]);

  // Plan Selection
  const selectPlan = (planKey) => {
    const plan = PLAN_DATA[planKey];
    const planObj = { plan: plan.name, weekly_cost: plan.price, coverage: plan.coverage };
    localStorage.setItem('gigshield_plan', JSON.stringify(planObj));
    setActivePlan(planObj);
  };

  // Trigger Logic Engine
  const [rainTrigger, setRainTrigger] = useState(false);
  const [heatTrigger, setHeatTrigger] = useState(false);
  const [pollutionTrigger, setPollutionTrigger] = useState(false);

  useEffect(() => {
    if (!weatherData || !activePlan || !user) {
      setRainTrigger(false);
      setHeatTrigger(false);
      setPollutionTrigger(false);
      return;
    }

    setRainTrigger(weatherData.rain > 40);
    setHeatTrigger(weatherData.temp > 42);
    setPollutionTrigger(weatherData.aqi > 300);

  }, [weatherData, activePlan, city, user]);

  const handleSubmitClaim = async () => {
    if (!user || !city) return;

    try {
      // Optimistic UI update to show "Pending/Checking" state immediately
      const optimisticClaim = {
        id: Date.now().toString(),
        trigger_type: "Evaluating...",
        city: city,
        payout: 0,
        status: "Pending",
        reason: "Checking conditions...",
        timestamp: new Date().toISOString()
      };
      setRecentClaims(prev => [optimisticClaim, ...prev]);

      const res = await fetch('http://127.0.0.1:5000/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: user.email,
          city: city
        })
      });
      const data = await res.json();

      if (res.ok) {
        // Refresh dashboard data instantly to fetch Approved/Rejected state
        fetchDashboardData();
      } else {
        console.error(`Claim error: ${data.reason || 'Verification Failed'}`);
        // Optionally revert optimistic UI here if needed
        fetchDashboardData();
      }

    } catch (err) {
      alert('Failed to submit claim. Please try again.');
      fetchDashboardData();
    }
  };

  if (!user) return null;

  if (!activePlan || isChangingPlan) {
    return (
      <div className="max-w-6xl mx-auto pb-24 relative pt-10 px-4">
        {activePlan && (
          <button onClick={() => setIsChangingPlan(false)} className="mb-4 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
            &larr; Back to Dashboard
          </button>
        )}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="glass-card-premium p-10 relative overflow-hidden mt-2">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3"><ShieldCheck className="w-8 h-8 text-primary" /> Choose Your Protection Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(PLAN_DATA).map(key => (
              <div key={key} className={`bg-white/5 border ${activePlan?.plan === PLAN_DATA[key].name ? 'border-secondary shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-white/10'} p-6 rounded-2xl flex flex-col hover:border-primary/50 transition-colors`}>
                <h3 className="font-bold text-xl">{PLAN_DATA[key].name}</h3>
                <div className="flex items-center justify-between mt-3 mb-5">
                  <span className="text-3xl font-bold text-primary">₹{PLAN_DATA[key].price}</span><span className="text-sm text-zinc-400">/ week</span>
                </div>
                <p className="text-sm text-zinc-300 mb-8 flex items-center gap-2"><IndianRupee className="w-5 h-5 text-secondary" /> Max {PLAN_DATA[key].coverage} protection</p>
                <button onClick={() => { selectPlan(key); setIsChangingPlan(false); }} className={`w-full mt-auto ${activePlan?.plan === PLAN_DATA[key].name ? 'bg-secondary hover:bg-secondary/90 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(99,102,241,0.4)]'} text-white py-3 rounded-xl font-bold transition-all text-sm shadow-lg hover:scale-[1.03]`}>
                  {activePlan?.plan === PLAN_DATA[key].name ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 relative overflow-x-hidden" onClick={() => setShowNotif(false)}>

      {/* NO LONGER USING FIXED TRIGGER BANNER ALERTS */}

      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-6 border-b border-white/10 gap-4 mt-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Worker Dashboard</h1>
          <p className="text-zinc-400 mt-1">Manage your coverage and track real-time disruptions.</p>
        </div>
        <div className="flex items-center gap-4 relative">

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowNotif(!showNotif); }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
            >
              {notifications && notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-alert shadow-[0_0_8px_rgba(249,115,22,0.8)] border-2 border-[#0B0F1A]" />}
              <Bell className="w-6 h-6 text-zinc-300" />
            </button>
            {showNotif && (
              <div onClick={(e) => e.stopPropagation()} className="absolute top-full right-0 mt-2 w-80 glass-card-premium p-4 z-50 max-h-[400px] overflow-y-auto hidden-scrollbar flex flex-col gap-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Notifications</h4>
                {!notifications || notifications.length === 0 ? (
                  <div className="text-zinc-500 text-sm text-center py-4">No new notifications</div>
                ) : (
                  notifications.map(n => {
                    const Icon = n.icon || (n.type === 'success' ? IndianRupee : n.type === 'error' ? AlertCircle : CheckCircle2);
                    const color = n.color || (n.type === 'success' ? 'text-secondary' : n.type === 'error' ? 'text-alert' : 'text-zinc-400');
                    return (
                      <div key={n.id} className="bg-white/5 border border-white/10 p-3 rounded-lg flex gap-3 items-start hover:bg-white/10 transition-colors cursor-pointer">
                        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} />
                        <div><p className="text-sm font-semibold">{n.title}</p><p className="text-xs text-zinc-400 mt-1 leading-snug">{n.desc}</p></div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          <Link to="/settings" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <Settings className="w-6 h-6 text-zinc-300" />
          </Link>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
            <span className="text-sm font-semibold">{user.name}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* =========================================
            LEFT COLUMN: Coverage & Weather
        ============================================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* --- ACTIVE COVERAGE --- */}
          <motion.div variants={fadeIn} className="glass-card-premium p-8 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10" />

            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Active Weekly Coverage</h2>
                <p className="text-sm text-zinc-400">Your income is protected against environmental disruptions.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/30 px-3 py-1.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                  </span>
                  <span className="text-[#22C55E] text-sm font-semibold">Status: Active</span>
                </div>
                <button onClick={() => setIsChangingPlan(true)} className="text-xs text-primary hover:text-white transition-colors underline underline-offset-2">Change Plan</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-6 rounded-2xl border border-white/10">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Current Plan</p>
                <p className="text-xl font-bold text-white flex items-center gap-2">
                  {activePlan.plan} <ShieldCheck className="w-5 h-5 text-primary" />
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Weekly Premium</p>
                <p className="text-xl font-bold text-white flex items-center"><IndianRupee className="w-5 h-5" />{activePlan.weekly_cost}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Income Protection</p>
                <p className="text-xl font-bold text-secondary flex items-center"><IndianRupee className="w-5 h-5" />{activePlan.coverage} max.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className={`border rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors ${rainTrigger || heatTrigger || pollutionTrigger ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <ShieldCheck className={`w-6 h-6 ${rainTrigger || heatTrigger || pollutionTrigger ? 'text-primary animate-pulse' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">Environmental Claim</h4>
                    <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                      Submit a single claim. Our AI Risk Engine will automatically evaluate live weather data in {city} for heavy rainfall, extreme heat, and severe pollution thresholds.
                    </p>

                    {/* Active Trigger Badges */}
                    {(rainTrigger || heatTrigger || pollutionTrigger) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {rainTrigger && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-blue-500/20 text-blue-400 rounded flex items-center gap-1"><CloudLightning className="w-3 h-3" /> Active: Rain</span>}
                        {heatTrigger && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-orange-500/20 text-orange-400 rounded flex items-center gap-1"><Flame className="w-3 h-3" /> Active: Heat</span>}
                        {pollutionTrigger && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-zinc-500/20 text-zinc-300 rounded flex items-center gap-1"><Wind className="w-3 h-3" /> Active: AQI</span>}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSubmitClaim}
                  className="font-bold py-3.5 px-8 w-full sm:w-auto rounded-xl transition-all whitespace-nowrap bg-primary hover:bg-primary/90 text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                >
                  Submit Claim
                </button>
              </div>
            </div>

          </motion.div>

          {/* --- REAL WEATHER MONITORING API - SPECIFIC UI DESIGN --- */}
          <motion.div variants={fadeIn} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/10 pb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Live Weather Data
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-sm font-bold text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                  >
                    <option value="Delhi" className="bg-[#0B0F1A]">Delhi</option>
                    <option value="Mumbai" className="bg-[#0B0F1A]">Mumbai</option>
                    <option value="Hyderabad" className="bg-[#0B0F1A]">Hyderabad</option>
                    <option value="Bangalore" className="bg-[#0B0F1A]">Bangalore</option>
                    <option value="Chennai" className="bg-[#0B0F1A]">Chennai</option>
                  </select>
                </div>
              </div>
            </div>

            {weatherError ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-zinc-500 mb-3" />
                <p className="text-zinc-400 font-medium">Weather data temporarily unavailable.</p>
                <p className="text-zinc-500 text-sm mt-1">Retrying automatically...</p>
              </div>
            ) : !weatherData ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 justify-between items-center text-center md:text-left">
                <div className="flex flex-col items-center md:items-start">
                  <p className="text-zinc-400 text-sm font-semibold mb-1 tracking-widest uppercase">City Name</p>
                  <h2 className="text-4xl font-bold flex items-center gap-3">
                    {city} {weatherData.temp > 42 ? <Flame className="w-8 h-8 text-alert animate-pulse" /> : <ThermometerSun className="w-8 h-8 text-orange-400" />}
                  </h2>
                  <p className="text-secondary font-medium mt-2">{weatherData.desc}</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-2xl text-center">
                  <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <ThermometerSun className="w-6 h-6 text-zinc-400 mb-2" />
                    <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Temperature</span>
                    <span className="text-2xl font-bold">{Math.round(weatherData.temp)}°C</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <CloudLightning className="w-6 h-6 text-zinc-400 mb-2" />
                    <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Condition</span>
                    <span className="text-xl font-bold truncate w-full">{weatherData.desc}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Droplets className="w-6 h-6 text-cyan-400 mb-2" />
                    <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Humidity</span>
                    <span className="text-2xl font-bold">{weatherData.humidity}%</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <CloudRain className="w-6 h-6 text-blue-400 mb-2" />
                    <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Rainfall</span>
                    <span className="text-2xl font-bold">{weatherData.rain} mm</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5 lg:col-span-4 mt-[-10px]">
                    <Wind className="w-6 h-6 text-zinc-300 mb-2" />
                    <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Wind Speed</span>
                    <span className="text-xl font-bold">{weatherData.wind} m/s</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

        </div>

        {/* =========================================
            RIGHT COLUMN: Claims & Notifications
        ============================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* --- RECENT CLAIMS CARD --- */}
          <motion.div variants={fadeIn} className="glass-card-premium p-6 flex flex-col max-h-[400px]">
            <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-3 flex items-center justify-between">
              Recent Claims
              <span className="bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded-full">{(recentClaims && recentClaims.length) || 0} Total</span>
            </h3>
            <div className="space-y-4 overflow-y-auto hidden-scrollbar flex-1 pr-2">
              <AnimatePresence>
                {!recentClaims || recentClaims.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center mt-6">No claims generated yet.</p>
                ) : (
                  recentClaims.map((claim) => (
                    <motion.div
                      key={claim.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1 pr-4">
                        <p className="font-bold text-sm text-white">{claim.trigger_type}</p>
                        <p className="text-xs text-zinc-300 py-1">{claim.city}</p>
                        <p className="text-xs text-zinc-400 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {claim.payout} compensation</p>
                        {claim.reason && <p className="text-xs text-zinc-400 mt-2 p-2 bg-white/5 border border-white/10 rounded-lg">{claim.reason}</p>}
                        <p className="text-xs text-zinc-500 mt-2">{new Date(claim.timestamp).toLocaleString()}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 flex items-center gap-1 rounded-md mb-auto mt-1 shrink-0 ${claim.status === 'Approved' ? 'bg-secondary/20 text-secondary' :
                        claim.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                        {claim.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                        {claim.status}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>

      </motion.div>

      {/* --- CLAIM REASON MODAL REMOVED - BUTTONS ARE NOW DIRECT --- */}
    </div>
  );
}
