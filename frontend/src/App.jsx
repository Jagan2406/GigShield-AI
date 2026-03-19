import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import PublicNavigation from './components/PublicNavigation';
import WorkerNavigation from './components/WorkerNavigation';
import AdminNavigation from './components/AdminNavigation';
import { useEffect, useState } from 'react';

function useBackgroundValidator() {
  useEffect(() => {
    const validateQueue = async () => {
      const claimsStr = localStorage.getItem('gigshield_claims');
      if (!claimsStr) return;
      
      let claims = JSON.parse(claimsStr);
      let pendingClaims = claims.filter(c => c.status === 'Checking');
      if (pendingClaims.length === 0) return;

      let changed = false;
      
      for (let claim of pendingClaims) {
          try {
              const res = await fetch(`http://127.0.0.1:5000/api/weather?city=${claim.city}`);
              if (!res.ok) continue;
              const data = await res.json();
              
              const rawRain = data.rain ? (data.rain['1h'] || 0) : 0;
              const rawTemp = data.main.temp;
              const rawAqi = claim.city.toLowerCase() === 'delhi' ? 350 : 150;
              
              let isEligible = false;
              let responseMsg = "";

              if (claim.reason === "Heavy Rainfall") {
                if (rawRain > 40) {
                  isEligible = true;
                  responseMsg = `Claim Approved – Your payout will be credited to your account within 3–6 hours.`;
                } else {
                  isEligible = false;
                  responseMsg = `Claim Rejected – Rainfall in ${claim.city} is less than 40mm, so the claim is not eligible.`;
                }
              } else if (claim.reason === "Extreme Heat") {
                if (rawTemp > 42) {
                  isEligible = true;
                  responseMsg = `Claim Approved – Your payout will be credited to your account within 3–6 hours.`;
                } else {
                  isEligible = false;
                  responseMsg = `Claim Rejected – Temperature in ${claim.city} is below 42°C.`;
                }
              } else if (claim.reason === "Severe Pollution") {
                if (rawAqi > 300) {
                  isEligible = true;
                  responseMsg = `Claim Approved – Your payout will be credited to your account within 3–6 hours.`;
                } else {
                  isEligible = false;
                  responseMsg = `Claim Rejected – AQI in ${claim.city} is below 300.`;
                }
              } else {
                isEligible = true;
                responseMsg = `Claim Approved – Your payout will be credited to your account within 3–6 hours.`;
              }

              claim.status = isEligible ? "Approved" : "Rejected";
              claim.response = responseMsg;
              changed = true;

              const notifKey = `gigshield_notifications_${claim.worker}`;
              const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
              existingNotifs.push({
                id: Date.now() + Math.random(),
                title: isEligible ? 'Claim Approved' : 'Claim Rejected',
                desc: responseMsg,
                type: isEligible ? 'success' : 'error',
                time: 'Just now'
              });
              localStorage.setItem(notifKey, JSON.stringify(existingNotifs));
          } catch(e) {}
      }
      
      if (changed) {
        localStorage.setItem('gigshield_claims', JSON.stringify(claims));
        window.dispatchEvent(new Event('storage'));
      }
    };

    const intervalId = setInterval(validateQueue, 3000);
    return () => clearInterval(intervalId);
  }, []);
}

// Quick guard component mapping to strict role checking
function ProtectedRoute({ children, allowedRole }) {
  const userStr = localStorage.getItem('gigshield_user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userStr);
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }
  return children;
}

function DynamicLayout({ children }) {
  useBackgroundValidator();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('gigshield_user');
      setUser(stored ? JSON.parse(stored) : null);
    };
    handleStorage();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [location.pathname]);

  // Determine which navigation to show
  let NavigationComponent = PublicNavigation;
  if (user?.role === 'admin') {
    NavigationComponent = AdminNavigation;
  } else if (user?.role === 'worker') {
    NavigationComponent = WorkerNavigation;
  }

  return (
    <>
      <NavigationComponent />
      <main className="container mx-auto px-4 py-8 flex-1">
        {children}
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-white flex flex-col">
        <DynamicLayout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="worker">
                <WorkerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
        </DynamicLayout>
      </div>
    </BrowserRouter>
  );
}

export default App;
