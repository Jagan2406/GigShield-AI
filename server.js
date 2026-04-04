require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const { User, Policy, Trigger, Claim, Activity, Admin, CityTier, WorkerLocation, WorkerActivity, SystemConfig } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gigshield-ai-secret-2026';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// MongoDB connection is handled in the startup function below

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --------------- Auth Middleware ---------------
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function adminAuth(req, res, next) {
    auth(req, res, () => {
        if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
        next();
    });
}

// --------------- Helper: Call Python AI Service ---------------
async function callAI(endpoint, data) {
    try {
        const res = await axios.post(`${AI_SERVICE_URL}${endpoint}`, data, { timeout: 5000 });
        return res.data;
    } catch (err) {
        console.error(`AI service error (${endpoint}):`, err.message);
        // Fallback values when AI service is unavailable
        const fallbacks = {
            '/ai/risk-score': { risk_score: 0.35, risk_level: 'Medium' },
            '/ai/fraud-score': { fraud_score: 0.12, fraud_result: 'Safe' },
            '/ai/premium': { premium: 30, payout: 1000 },
            '/ai/city-tier': { city_tier: 2 }
        };
        return fallbacks[endpoint] || {};
    }
}

// --------------- Helper: Fetch OpenWeather Data ---------------
async function fetchWeather(city) {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY_HERE') {
        return {
            rain: Math.floor(Math.random() * 80),
            temp: 28 + Math.floor(Math.random() * 15),
            aqi: 80 + Math.floor(Math.random() * 200),
            humidity: 50 + Math.floor(Math.random() * 40),
            wind_speed: 5 + Math.floor(Math.random() * 20),
            description: 'clear sky'
        };
    }
    try {
        const weatherRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        const aqiRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${weatherRes.data.coord.lat}&lon=${weatherRes.data.coord.lon}&appid=${OPENWEATHER_API_KEY}`
        );
        const rain = weatherRes.data.rain?.['1h'] || weatherRes.data.rain?.['3h'] || 0;
        const temp = weatherRes.data.main.temp;
        const aqi = aqiRes.data.list[0].main.aqi * 80; // scale 1-5 to approximate AQI
        return {
            rain: Math.round(rain),
            temp: Math.round(temp),
            aqi: Math.round(aqi),
            humidity: weatherRes.data.main.humidity,
            wind_speed: weatherRes.data.wind.speed,
            description: weatherRes.data.weather[0].description
        };
    } catch (err) {
        console.error('Weather API error:', err.message);
        return { rain: 0, temp: 35, aqi: 150, humidity: 60, wind_speed: 10, description: 'N/A' };
    }
}

async function fetchForecast(city) {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY_HERE') {
        return { rain_forecast: Math.floor(Math.random() * 100), temp_forecast: 30 + Math.floor(Math.random() * 12), aqi_forecast: 100 + Math.floor(Math.random() * 200) };
    }
    try {
        const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city},IN&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=8`
        );
        const items = res.data.list;
        const maxRain = Math.max(...items.map(i => i.rain?.['3h'] || 0));
        const maxTemp = Math.max(...items.map(i => i.main.temp));
        return { rain_forecast: Math.round(maxRain), temp_forecast: Math.round(maxTemp), aqi_forecast: 150 };
    } catch (err) {
        return { rain_forecast: 0, temp_forecast: 35, aqi_forecast: 150 };
    }
}

// --------------- Seed Data ---------------
async function seedDatabase() {
    await CityTier.deleteMany({});
    const cities = [
        { city: 'Mumbai', tier: 1, rain_trigger: 300 },
        { city: 'Delhi', tier: 1, rain_trigger: 300 },
        { city: 'Bangalore', tier: 1, rain_trigger: 300 },
        { city: 'Chennai', tier: 1, rain_trigger: 300 },
        { city: 'Hyderabad', tier: 2, rain_trigger: 150 },
        { city: 'Pune', tier: 2, rain_trigger: 150 },
        { city: 'Kolkata', tier: 2, rain_trigger: 150 },
        { city: 'Ahmedabad', tier: 2, rain_trigger: 150 },
        { city: 'Jaipur', tier: 2, rain_trigger: 150 },
        { city: 'Lucknow', tier: 3, rain_trigger: 80 },
        { city: 'Patna', tier: 3, rain_trigger: 80 },
        { city: 'Bhopal', tier: 3, rain_trigger: 80 },
        { city: 'Nagpur', tier: 3, rain_trigger: 80 },
        { city: 'Indore', tier: 3, rain_trigger: 80 }
    ];
    await CityTier.insertMany(cities);

    // Initialize Global Configs
    const configs = [
        { key: 'weekly_premium', value: 30 },
        { key: 'payout_amount', value: 1000 },
        { key: 'heat_threshold', value: 43 },
        { key: 'aqi_threshold', value: 300 }
    ];
    for (let c of configs) {
        if (!(await SystemConfig.findOne({ key: c.key }))) {
            await SystemConfig.create(c);
        }
    }

    // Default admin fallback
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        await Admin.create({ total_premium: 0, total_payout: 0, loss_ratio: 0.0 });
    }

    const adminUser = await User.findOne({ is_admin: true });
    if (!adminUser) {
        const hash = bcrypt.hashSync('admin123', 10);
        await User.create({
            name: 'Admin',
            phone: '9999999999',
            email: 'admin@gigshield.ai',
            password: hash,
            city: 'Mumbai',
            platform: 'System',
            vehicle: 'N/A',
            weekly_income: 0,
            work_hours: 24,
            city_tier: 1,
            risk_score: 0,
            is_admin: true
        });
        console.log('Default admin seeded.');
    }
}


// ===================== AUTH ROUTES =====================

// POST /api/register
app.post('/api/register', upload.fields([
    { name: 'id_proof', maxCount: 1 },
    { name: 'platform_screenshot', maxCount: 1 },
    { name: 'earnings_screenshot', maxCount: 1 }
]), async (req, res) => {
    try {
        const { full_name, phone, email, password, city, area, platform, vehicle_type, avg_weekly_income, working_days, working_hours, upi_id, bank_name, account_number, ifsc_code } = req.body;

        const existing = await User.findOne({ $or: [{ email }, { phone }] });
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const hash = bcrypt.hashSync(password, 10);

        const cityConfig = await CityTier.findOne({ city });
        const tier = cityConfig ? cityConfig.tier : 2;

        // Call Python AI for risk and city tier
        const riskResult = await callAI('/ai/risk-score', { city, tier });
        const tierResult = await callAI('/ai/city-tier', { city });

        const files = req.files || {};
        const docs = {
            id_proof: files.id_proof?.[0]?.filename || null,
            platform_screenshot: files.platform_screenshot?.[0]?.filename || null,
            earnings_screenshot: files.earnings_screenshot?.[0]?.filename || null
        };

        const user = await User.create({
            name: full_name,
            phone,
            email,
            password: hash,
            city,
            platform: platform || '',
            vehicle: vehicle_type || '',
            weekly_income: parseFloat(avg_weekly_income) || 0,
            work_hours: parseInt(working_hours) || 8,
            documents: docs,
            city_tier: tier,
            risk_score: riskResult.risk_score,
            is_admin: false
        });

        // Seed initial activity data
        for (let i = 0; i < 7; i++) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const isOff = i === 2;
            await Activity.create({
                user_id: user._id,
                date: d,
                hours_worked: isOff ? 0 : 5 + Math.random() * 4,
                distance: isOff ? 0 : 15 + Math.random() * 20,
                gps_lat: 17.385 + Math.random() * 0.05,
                gps_lng: 78.486 + Math.random() * 0.05,
                activity_status: isOff ? 'Inactive' : 'Active'
            });
        }

        const tierLabel = tier === 1 ? 'Metro City' : tier === 2 ? 'Urban City' : 'Semi-Urban City';
        const riskLevel = riskResult.risk_level || (riskResult.risk_score > 0.6 ? 'High' : riskResult.risk_score > 0.3 ? 'Medium' : 'Low');

        const token = jwt.sign({ id: user._id, email, full_name, is_admin: false }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { id: user._id, full_name, email, city, city_tier: tier },
            verification: {
                status: 'Verification Successful',
                city_tier: `Tier ${tier}`,
                city_tier_label: tierLabel,
                risk_score: riskLevel,
                risk_probability: riskResult.risk_score,
                message: 'You can now buy weekly policy.'
            }
        });
    } catch (e) {
        console.error('Register error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id, email: user.email, full_name: user.name, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                full_name: user.name,
                email: user.email,
                city: user.city,
                is_admin: user.is_admin,
                city_tier: user.city_tier
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== DASHBOARD =====================

// GET /api/dashboard
app.get('/api/dashboard', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const policy = await Policy.findOne({ user_id: user._id, status: 'active' }).sort({ createdAt: -1 });
        const claims = await Claim.find({ user_id: user._id }).sort({ date: -1 });
        const cityConfig = await CityTier.findOne({ city: user.city });

        // Fetch live weather
        const weather = await fetchWeather(user.city);

        let daysRemaining = 0;
        if (policy) {
            const end = new Date(policy.end_date);
            daysRemaining = Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
        }

        const heatConf = await SystemConfig.findOne({ key: 'heat_threshold' });
        const aqiConf = await SystemConfig.findOne({ key: 'aqi_threshold' });
        
        const heatThreshold = heatConf?.value || 43;
        const aqiThreshold = aqiConf?.value || 300;

        const triggers = [];
        if (cityConfig) {
            const rainThreshold = cityConfig.rain_trigger || 300;
            triggers.push({
                name: 'Rain',
                current: weather.rain_forecast || weather.rain || 0,
                threshold: rainThreshold,
                unit: 'mm',
                progress: Math.min(100, Math.round(((weather.rain_forecast || weather.rain || 0) / rainThreshold) * 100)),
                triggered: (weather.rain_forecast || weather.rain || 0) > rainThreshold
            });
            triggers.push({
                name: 'Temperature',
                current: weather.temp_forecast || weather.temp || 0,
                threshold: heatThreshold,
                unit: 'C',
                progress: Math.min(100, Math.round(((weather.temp_forecast || weather.temp || 0) / heatThreshold) * 100)),
                triggered: (weather.temp_forecast || weather.temp || 0) > heatThreshold
            });
            triggers.push({
                name: 'AQI',
                current: weather.aqi_forecast || weather.aqi || 0,
                threshold: aqiThreshold,
                unit: '',
                progress: Math.min(100, Math.round(((weather.aqi_forecast || weather.aqi || 0) / aqiThreshold) * 100)),
                triggered: (weather.aqi_forecast || weather.aqi || 0) > aqiThreshold
            });
        }

        const riskLevel = user.risk_score > 0.6 ? 'High' : user.risk_score > 0.3 ? 'Medium' : 'Low';

        res.json({
            user: {
                full_name: user.name,
                city: user.city,
                city_tier: user.city_tier,
                risk_level: riskLevel,
                risk_score: user.risk_score,
                platform: user.platform
            },
            policy: policy ? {
                id: policy._id,
                status: policy.status,
                premium: policy.premium,
                payout: policy.payout,
                start_date: policy.start_date,
                end_date: policy.end_date,
                days_remaining: daysRemaining
            } : null,
            triggers,
            earnings_protection: {
                weekly_income: user.weekly_income,
                protected_amount: policy ? policy.payout : 0,
                policy_status: policy ? 'Active' : 'Inactive',
                days_remaining: daysRemaining
            },
            claims_summary: {
                total: claims.length,
                paid: claims.filter(c => c.status === 'paid').length,
                total_payout: claims.filter(c => c.status === 'paid').reduce((s, c) => s + (c.payout || 0), 0)
            },
            notifications: [],
            weather
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== WEATHER and AQI =====================

// GET /api/weather
app.get('/api/weather', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const cityConfig = await CityTier.findOne({ city: user.city });
        const weather = await fetchWeather(user.city);
        const forecast = await fetchForecast(user.city);

        res.json({
            city: user.city,
            rain: weather.rain,
            temp: weather.temp,
            aqi: weather.aqi,
            humidity: weather.humidity,
            wind_speed: weather.wind_speed,
            description: weather.description,
            rain_forecast: forecast.rain_forecast,
            temp_forecast: forecast.temp_forecast,
            aqi_forecast: forecast.aqi_forecast,
            flood_alert: cityConfig ? weather.rain > cityConfig.rain_trigger * 0.8 : false,
            curfew_alert: false
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/aqi
app.get('/api/aqi', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const weather = await fetchWeather(user.city);
        const aqiConf = await SystemConfig.findOne({ key: 'aqi_threshold' });
        const aqiThreshold = aqiConf?.value || 300;
        
        res.json({
            city: user.city,
            aqi: Math.round(weather.aqi_forecast),
            threshold: aqiThreshold,
            triggered: weather.aqi_forecast > aqiThreshold,
            status: weather.aqi_forecast > 300 ? 'Hazardous' : weather.aqi_forecast > 200 ? 'Very Unhealthy' : weather.aqi_forecast > 150 ? 'Unhealthy' : weather.aqi_forecast > 100 ? 'Moderate' : 'Good'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== TRIGGERS =====================

// GET /api/trigger-status
app.get('/api/trigger-status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const cityConfig = await CityTier.findOne({ city: user.city });
        const heatConf = await SystemConfig.findOne({ key: 'heat_threshold' });
        const aqiConf = await SystemConfig.findOne({ key: 'aqi_threshold' });
        
        if (!cityConfig) return res.json({ triggers: [], overall: 'SAFE' });

        const weather = await fetchWeather(user.city);
        const heatThresh = heatConf?.value || 43;
        const aqiThresh = aqiConf?.value || 300;

        const triggers = [
            { name: 'Rain', current: weather.rain, threshold: cityConfig.rain_trigger, unit: 'mm', triggered: weather.rain > cityConfig.rain_trigger },
            { name: 'Temperature', current: weather.temp, threshold: heatThresh, unit: 'C', triggered: weather.temp > heatThresh },
            { name: 'AQI', current: weather.aqi, threshold: aqiThresh, unit: '', triggered: weather.aqi > aqiThresh }
        ];
        const overall = triggers.some(t => t.triggered) ? 'TRIGGERED' : 'SAFE';

        res.json({ triggers, overall, city: cityConfig.city, tier: cityConfig.tier });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Also keep backward compat route
app.get('/api/triggers', auth, (req, res, next) => { req.url = '/api/trigger-status'; next(); });

app.get('/api/trigger-history', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const history = await Trigger.find({ city: user.city }).sort({ date: -1 }).limit(20);
        res.json({ history });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== POLICY =====================

// GET /api/policy
app.get('/api/policy', auth, async (req, res) => {
    try {
        const policy = await Policy.findOne({ user_id: req.user.id, status: 'active' }).sort({ createdAt: -1 });
        const user = await User.findById(req.user.id);
        if (!policy) return res.json({ policy: null });

        const daysRemaining = Math.max(0, Math.ceil((new Date(policy.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
        const cityConfig = await CityTier.findOne({ city: user.city });
        const heatConf = await SystemConfig.findOne({ key: 'heat_threshold' });
        const aqiConf = await SystemConfig.findOne({ key: 'aqi_threshold' });

        res.json({
            policy: {
                id: policy._id,
                status: policy.status,
                premium: policy.premium,
                payout: policy.payout,
                start_date: policy.start_date,
                end_date: policy.end_date,
                days_remaining: daysRemaining,
                worker_name: user.name,
                city: user.city,
                city_tier: user.city_tier,
                rain_threshold: cityConfig?.rain_trigger,
                temp_threshold: heatConf?.value || 43,
                aqi_threshold: aqiConf?.value || 300
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/buy-policy
app.post('/api/buy-policy', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const cityConfig = await CityTier.findOne({ city: user.city });

        const existing = await Policy.findOne({ user_id: user._id, status: 'active' });
        if (existing) return res.status(400).json({ error: 'You already have an active policy' });

        const premiumConf = await SystemConfig.findOne({ key: 'weekly_premium' });
        const payoutConf = await SystemConfig.findOne({ key: 'payout_amount' });
        
        const premium = premiumConf?.value || 30;
        const payout = payoutConf?.value || 1000;

        const now = new Date();
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const policy = await Policy.create({
            user_id: user._id,
            premium,
            payout,
            start_date: now,
            end_date: end,
            city_tier: user.city_tier,
            status: 'active'
        });

        // Update admin stats
        await Admin.updateOne({}, { $inc: { total_premium: premium } });

        res.json({
            success: true,
            policy_id: policy._id,
            premium,
            payout,
            start_date: now.toISOString(),
            end_date: end.toISOString(),
            transaction_id: 'TXN' + Math.floor(10000 + Math.random() * 90000)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/renew', auth, async (req, res) => {
    try {
        const policy = await Policy.findOne({ user_id: req.user.id, status: 'active' }).sort({ createdAt: -1 });
        if (!policy) return res.status(404).json({ error: 'No active policy to renew' });

        policy.status = 'expired';
        await policy.save();

        const now = new Date();
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const newPolicy = await Policy.create({
            user_id: req.user.id,
            premium: policy.premium,
            payout: policy.payout,
            start_date: now,
            end_date: end,
            city_tier: policy.city_tier,
            status: 'active'
        });

        res.json({ success: true, new_policy_id: newPolicy._id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/pause', auth, async (req, res) => {
    try {
        await Policy.updateMany({ user_id: req.user.id, status: 'active' }, { status: 'paused' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/cancel', auth, async (req, res) => {
    try {
        await Policy.updateMany({ user_id: req.user.id, status: 'active' }, { status: 'cancelled' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== CLAIMS =====================

// POST /api/claim
app.post('/api/claim', auth, async (req, res) => {
    try {
        const { trigger_type, trigger_value } = req.body;
        const user = await User.findById(req.user.id);
        const policy = await Policy.findOne({ user_id: user._id, status: 'active' });
        if (!policy) return res.status(400).json({ error: 'No active policy' });

        // one payout per week check
        const recentClaim = await Claim.findOne({ user_id: user._id, status: 'paid', date: { $gte: new Date(Date.now() - 7*24*60*60*1000) } });
        if (recentClaim) return res.status(400).json({ error: 'Already received a payout this week' });

        // Check activity eligibility
        const activities = await WorkerActivity.find({ user_id: user._id }).sort({ date: -1 }).limit(7);
        const totalHours = activities.reduce((s, a) => s + a.hours_worked, 0);
        const totalDist = activities.reduce((s, a) => s + a.distance_travelled, 0);
        const activeDays = activities.filter(a => a.status === 'Active').length;
        const workerActive = totalHours >= 4 && totalDist >= 10 && activeDays >= 3;

        // Fraud check mock or python fallback. 
        // We will mock it using generic risk score as fallback for now
        let fraudScore = user.risk_score || 0.1;
        try {
            const fraudResult = await callAI('/ai/fraud-score', { user_id: user._id, trigger_type, active_days: activeDays });
            if (fraudResult && fraudResult.fraud_score !== undefined) fraudScore = fraudResult.fraud_score;
        } catch(e) {}

        const cityConfig = await CityTier.findOne({ city: user.city });
        const heatConf = await SystemConfig.findOne({ key: 'heat_threshold' });
        const aqiConf = await SystemConfig.findOne({ key: 'aqi_threshold' });
        const payoutConf = await SystemConfig.findOne({ key: 'payout_amount' });

        let threshold = 150;
        if (trigger_type === 'Rain') threshold = cityConfig?.rain_trigger || 300;
        if (trigger_type === 'Heat') threshold = heatConf?.value || 43;
        if (trigger_type === 'AQI') threshold = aqiConf?.value || 300;

        const triggerValid = trigger_value > threshold;
        const fraudSafe = fraudScore < 0.7;
        const payoutAmt = payoutConf?.value || 1000;
        const approved = triggerValid && policy.status === 'active' && workerActive && fraudSafe;

        const claim = await Claim.create({
            user_id: user._id,
            trigger_type,
            trigger_value,
            payout: approved ? payoutAmt : 0,
            status: approved ? 'paid' : 'rejected',
            fraud_score: fraudScore,
            date: new Date()
        });

        if (approved) {
            await Admin.updateOne({}, { $inc: { total_payout: payoutAmt } });
            // Recalculate loss ratio
            const adminStats = await Admin.findOne();
            if (adminStats && adminStats.total_premium > 0) {
                adminStats.loss_ratio = Math.round((adminStats.total_payout / adminStats.total_premium) * 100) / 100;
                await adminStats.save();
            }
        }

        res.json({
            success: true,
            claim_id: claim._id,
            status: claim.status,
            payout: claim.payout,
            fraud_score: fraudScore,
            fraud_result: fraudScore < 0.7 ? "Safe" : "Fraud",
            worker_active: workerActive,
            trigger_valid: triggerValid,
            message: approved ? 'Claim approved and payout settled.' : 'Claim rejected due to eligibility or trigger rules.'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/claims (backward compat)
app.get('/api/claims', auth, async (req, res) => {
    try {
        const claims = await Claim.find({ user_id: req.user.id }).sort({ date: -1 });
        const latestClaim = claims[0] || null;

        let processingSteps = null;
        let fraudResult = null;
        if (latestClaim) {
            processingSteps = [
                { step: 'Trigger Verification', status: 'completed', detail: `${latestClaim.trigger_type} = ${latestClaim.trigger_value}` },
                { step: 'Policy Check', status: 'completed', detail: 'Policy active' },
                { step: 'Worker Activity Check', status: 'completed', detail: 'Worker active' },
                { step: 'Fraud Detection', status: 'completed', detail: `Score: ${latestClaim.fraud_score}` },
                { step: 'Payout', status: latestClaim.status === 'paid' ? 'completed' : 'rejected', detail: latestClaim.status === 'paid' ? `Payout: ${latestClaim.payout}` : 'Rejected' }
            ];
            fraudResult = {
                gps_verified: true,
                worker_active: true,
                duplicate_claim: false,
                suspicious_activity: false,
                fraud_score: latestClaim.fraud_score,
                fraud_result: latestClaim.fraud_score < 0.7 ? 'Safe' : 'Fraud'
            };
        }

        res.json({
            latest: latestClaim,
            processing_steps: processingSteps,
            fraud_result: fraudResult,
            history: claims
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== ACTIVITY =====================

// GET /api/activity
app.get('/api/activity', auth, async (req, res) => {
    try {
        const activities = await Activity.find({ user_id: req.user.id }).sort({ date: -1 }).limit(7);

        const totalHours = activities.reduce((s, a) => s + a.hours_worked, 0);
        const totalDistance = activities.reduce((s, a) => s + a.distance, 0);
        const activeDays = activities.filter(a => a.activity_status === 'Active').length;

        // Map to field names frontend expects
        const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
        const log = activities.map((a, i) => ({
            date: a.date,
            hours_worked: a.hours_worked,
            distance_km: a.distance,
            deliveries: a.activity_status === 'Active' ? Math.floor(8 + Math.random() * 12) : 0,
            zone: a.activity_status === 'Active' ? zones[i % zones.length] : '--',
            status: a.activity_status
        }));

        res.json({
            summary: {
                active_days: activeDays,
                total_hours: Math.round(totalHours),
                total_distance: Math.round(totalDistance),
                total_deliveries: activeDays * 10,
                status: activeDays >= 3 ? 'Active' : 'Inactive'
            },
            log,
            eligibility: {
                active_this_week: activeDays >= 3,
                min_hours_completed: totalHours >= 15,
                eligible_for_payout: activeDays >= 3 && totalHours >= 15
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/eligibility', auth, async (req, res) => {
    try {
        const activities = await Activity.find({ user_id: req.user.id }).sort({ date: -1 }).limit(7);
        const totalHours = activities.reduce((s, a) => s + a.hours_worked, 0);
        const activeDays = activities.filter(a => a.activity_status === 'Active').length;
        res.json({
            active_this_week: activeDays >= 3,
            min_hours_completed: totalHours >= 15,
            eligible_for_payout: activeDays >= 3 && totalHours >= 15
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== LOCATION TRACKING SYSTEM =====================

// Helper: Haversine distance (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper: Classify zone
function classifyZone(lat, lng) {
    const latMod = ((lat % 0.1) + 0.1) % 0.1;
    const lngMod = ((lng % 0.1) + 0.1) % 0.1;
    if (latMod < 0.025 && lngMod < 0.05) return 'Zone A';
    if (latMod < 0.05 && lngMod < 0.05) return 'Zone B';
    if (latMod < 0.075) return 'Zone C';
    return 'Zone D';
}

// Helper: Get or create today's WorkerActivity
async function getOrCreateTodayActivity(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let activity = await WorkerActivity.findOne({ user_id: userId, date: { $gte: today } });
    if (!activity) {
        activity = await WorkerActivity.create({ user_id: userId, date: today });
    }
    return activity;
}

// Helper: Recalculate distance from all GPS points today
async function recalcDistance(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const points = await WorkerLocation.find({ user_id: userId, date: { $gte: today } }).sort({ timestamp: 1 });
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
        dist += haversineDistance(points[i - 1].latitude, points[i - 1].longitude, points[i].latitude, points[i].longitude);
    }
    return Math.round(dist * 100) / 100;
}

// Helper: Determine fraud risk
function determineFraudRisk(hoursWorked, distance, gpsCount) {
    if (gpsCount === 0) return 'High';
    if (hoursWorked < 2 && distance < 3) return 'High';
    if (hoursWorked < 3 || distance < 5) return 'Medium';
    return 'Low';
}

// Helper: Determine eligibility
function determineEligibility(hoursWorked, distance) {
    return (hoursWorked >= 4 && distance >= 10) ? 'Yes' : 'No';
}


// ========== WORKER-SIDE APIs ==========

// POST /api/location/start — Worker clicks "Start Work"
app.post('/api/location/start', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.is_admin) return res.status(403).json({ error: 'Admin cannot track location. This is for workers only.' });

        const { latitude, longitude } = req.body;
        if (!latitude || !longitude) return res.status(400).json({ error: 'latitude and longitude are required' });

        const activity = await getOrCreateTodayActivity(user._id);

        if (activity.tracking_active) {
            return res.status(400).json({ error: 'Tracking is already active.' });
        }

        const zone = classifyZone(latitude, longitude);
        const now = new Date();

        activity.tracking_active = true;
        activity.tracking_start_time = now;
        activity.status = 'Active';
        activity.current_lat = latitude;
        activity.current_lng = longitude;
        activity.zone = zone;
        activity.last_gps_time = now;
        await activity.save();

        // Save first GPS point
        await WorkerLocation.create({ user_id: user._id, latitude, longitude, timestamp: now });
        activity.gps_count = (activity.gps_count || 0) + 1;
        await activity.save();

        // Also update old Activity model for claim eligibility
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let oldActivity = await Activity.findOne({ user_id: user._id, date: { $gte: today } });
        if (!oldActivity) {
            oldActivity = await Activity.create({
                user_id: user._id, date: new Date(), hours_worked: 0, distance: 0,
                gps_lat: latitude, gps_lng: longitude, activity_status: 'Active',
                tracking_active: true, tracking_start_time: now, zone,
                location_history: [{ latitude, longitude, timestamp: now, zone }]
            });
        } else {
            oldActivity.tracking_active = true;
            oldActivity.tracking_start_time = now;
            oldActivity.activity_status = 'Active';
            oldActivity.gps_lat = latitude;
            oldActivity.gps_lng = longitude;
            oldActivity.zone = zone;
            oldActivity.location_history.push({ latitude, longitude, timestamp: now, zone });
            await oldActivity.save();
        }

        res.json({
            success: true,
            message: 'Tracking started',
            zone,
            timestamp: now.toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// POST /api/location/update — Worker sends GPS every 5 minutes
app.post('/api/location/update', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.is_admin) return res.status(403).json({ error: 'Admin cannot track location.' });

        const { latitude, longitude } = req.body;
        if (!latitude || !longitude) return res.status(400).json({ error: 'latitude and longitude required' });

        const activity = await getOrCreateTodayActivity(user._id);

        if (!activity.tracking_active) {
            return res.status(400).json({ error: 'Not tracking. Click Start Work first.' });
        }

        const now = new Date();
        const zone = classifyZone(latitude, longitude);

        // Save GPS point
        await WorkerLocation.create({ user_id: user._id, latitude, longitude, timestamp: now });

        // Update activity
        activity.current_lat = latitude;
        activity.current_lng = longitude;
        activity.zone = zone;
        activity.last_gps_time = now;
        activity.gps_count = (activity.gps_count || 0) + 1;

        // Recalculate hours
        if (activity.tracking_start_time) {
            activity.hours_worked = Math.round(((now - new Date(activity.tracking_start_time)) / 3600000) * 100) / 100;
        }

        // Recalculate distance
        activity.distance_travelled = await recalcDistance(user._id);

        // Update fraud & eligibility
        activity.fraud_risk = determineFraudRisk(activity.hours_worked, activity.distance_travelled, activity.gps_count);
        activity.eligible_for_claim = determineEligibility(activity.hours_worked, activity.distance_travelled);

        await activity.save();

        // Sync to old Activity model
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const oldAct = await Activity.findOne({ user_id: user._id, date: { $gte: today } });
        if (oldAct) {
            oldAct.gps_lat = latitude;
            oldAct.gps_lng = longitude;
            oldAct.zone = zone;
            oldAct.hours_worked = activity.hours_worked;
            oldAct.distance = activity.distance_travelled;
            oldAct.distance_travelled = activity.distance_travelled;
            oldAct.location_history.push({ latitude, longitude, timestamp: now, zone });
            await oldAct.save();
        }

        res.json({
            success: true,
            latitude, longitude, zone,
            hours_worked: activity.hours_worked,
            distance_travelled: activity.distance_travelled,
            gps_count: activity.gps_count,
            fraud_risk: activity.fraud_risk,
            eligible_for_claim: activity.eligible_for_claim,
            timestamp: now.toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// POST /api/location/stop — Worker clicks "Stop Work"
app.post('/api/location/stop', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.is_admin) return res.status(403).json({ error: 'Admin cannot track location.' });

        const { latitude, longitude } = req.body;
        const activity = await getOrCreateTodayActivity(user._id);

        if (!activity.tracking_active) {
            return res.status(400).json({ error: 'No active tracking session.' });
        }

        const now = new Date();
        const zone = classifyZone(latitude || activity.current_lat, longitude || activity.current_lng);

        // Save final GPS point
        if (latitude && longitude) {
            await WorkerLocation.create({ user_id: user._id, latitude, longitude, timestamp: now });
            activity.gps_count = (activity.gps_count || 0) + 1;
        }

        // Final calculations
        if (activity.tracking_start_time) {
            activity.hours_worked = Math.round(((now - new Date(activity.tracking_start_time)) / 3600000) * 100) / 100;
        }
        activity.distance_travelled = await recalcDistance(user._id);
        activity.fraud_risk = determineFraudRisk(activity.hours_worked, activity.distance_travelled, activity.gps_count);
        activity.eligible_for_claim = determineEligibility(activity.hours_worked, activity.distance_travelled);
        activity.tracking_active = false;
        if (latitude) activity.current_lat = latitude;
        if (longitude) activity.current_lng = longitude;
        activity.zone = zone;
        await activity.save();

        // Sync to old Activity
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const oldAct = await Activity.findOne({ user_id: user._id, date: { $gte: today } });
        if (oldAct) {
            oldAct.tracking_active = false;
            oldAct.hours_worked = activity.hours_worked;
            oldAct.distance = activity.distance_travelled;
            oldAct.distance_travelled = activity.distance_travelled;
            if (latitude && longitude) {
                oldAct.gps_lat = latitude;
                oldAct.gps_lng = longitude;
                oldAct.location_history.push({ latitude, longitude, timestamp: now, zone });
            }
            await oldAct.save();
        }

        res.json({
            success: true,
            message: 'Tracking stopped',
            hours_worked: activity.hours_worked,
            distance_travelled: activity.distance_travelled,
            gps_count: activity.gps_count,
            fraud_risk: activity.fraud_risk,
            eligible_for_claim: activity.eligible_for_claim
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// GET /api/location/user — Worker sees their own location history today
app.get('/api/location/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const locations = await WorkerLocation.find({ user_id: user._id, date: { $gte: today } }).sort({ timestamp: 1 });
        const activity = await getOrCreateTodayActivity(user._id);

        res.json({
            tracking_active: activity.tracking_active,
            current_location: (activity.current_lat && activity.current_lng) ? {
                latitude: activity.current_lat,
                longitude: activity.current_lng
            } : null,
            locations: locations.map(l => ({ latitude: l.latitude, longitude: l.longitude, timestamp: l.timestamp })),
            summary: {
                hours_worked: activity.hours_worked,
                distance_travelled: activity.distance_travelled,
                zone: activity.zone,
                gps_count: activity.gps_count,
                status: activity.status,
                eligible_for_claim: activity.eligible_for_claim,
                fraud_risk: activity.fraud_risk,
                tracking_start_time: activity.tracking_start_time
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// GET /api/activity/user — Worker sees their own activity stats
app.get('/api/activity/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const activity = await getOrCreateTodayActivity(user._id);

        res.json({
            user_id: user._id,
            full_name: user.name,
            date: activity.date,
            hours_worked: activity.hours_worked,
            distance_travelled: activity.distance_travelled,
            status: activity.status,
            eligible_for_claim: activity.eligible_for_claim,
            fraud_risk: activity.fraud_risk,
            zone: activity.zone,
            gps_count: activity.gps_count,
            tracking_active: activity.tracking_active
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ========== ADMIN-SIDE APIs ==========

// GET /api/admin/live-workers — All currently active workers
app.get('/api/admin/live-workers', adminAuth, async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const allActivities = await WorkerActivity.find({ date: { $gte: today } });
        const activeWorkers = allActivities.filter(a => a.tracking_active);
        const inactiveWorkers = allActivities.filter(a => !a.tracking_active);
        const eligibleCount = allActivities.filter(a => a.eligible_for_claim === 'Yes').length;
        const fraudRisk = allActivities.filter(a => a.fraud_risk === 'High').length;

        // Get user details for active workers
        const workers = [];
        for (const a of allActivities) {
            const u = await User.findById(a.user_id);
            if (!u || u.is_admin) continue;
            workers.push({
                user_id: u._id,
                worker_name: u.name,
                city: u.city,
                platform: u.platform,
                current_location: (a.current_lat && a.current_lng) ? {
                    latitude: a.current_lat,
                    longitude: a.current_lng
                } : null,
                hours_worked: a.hours_worked,
                distance_travelled: a.distance_travelled,
                status: a.tracking_active ? 'Active' : a.status,
                fraud_risk: a.fraud_risk,
                eligible_for_claim: a.eligible_for_claim,
                zone: a.zone,
                gps_count: a.gps_count,
                tracking_active: a.tracking_active,
                tracking_since: a.tracking_start_time,
                last_gps_time: a.last_gps_time
            });
        }

        res.json({
            total_workers: allActivities.length,
            currently_active: activeWorkers.length,
            inactive: inactiveWorkers.length,
            eligible_for_claim: eligibleCount,
            fraud_risk_workers: fraudRisk,
            workers
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// GET /api/location/all — Admin: all GPS points today (for map)
app.get('/api/location/all', adminAuth, async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const locations = await WorkerLocation.find({ date: { $gte: today } }).sort({ timestamp: -1 }).limit(500);
        res.json({ locations });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// GET /api/activity/all — Admin: all activities today
app.get('/api/activity/all', adminAuth, async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const activities = await WorkerActivity.find({ date: { $gte: today } });

        const result = [];
        for (const a of activities) {
            const u = await User.findById(a.user_id);
            if (!u || u.is_admin) continue;
            result.push({
                worker_name: u.name,
                city: u.city,
                hours_worked: a.hours_worked,
                distance_travelled: a.distance_travelled,
                status: a.tracking_active ? 'Active' : a.status,
                fraud_risk: a.fraud_risk,
                eligible_for_claim: a.eligible_for_claim
            });
        }
        res.json({ activities: result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// Backward compat: POST /api/location, GET /api/location-history, GET /api/tracking-status, GET /api/admin/worker-locations
app.post('/api/location', auth, async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const user = await User.findById(req.user.id);
        if (latitude && longitude) {
            await WorkerLocation.create({ user_id: user._id, latitude, longitude });
        }
        res.json({ success: true, location: { latitude, longitude, timestamp: new Date().toISOString(), user_id: user._id } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Alias old routes to new ones
app.post('/api/start-tracking', auth, (req, res, next) => { req.url = '/api/location/start'; next(); });
app.post('/api/stop-tracking', auth, (req, res, next) => { req.url = '/api/location/stop'; next(); });
app.post('/api/update-location', auth, (req, res, next) => { req.url = '/api/location/update'; next(); });

app.get('/api/location-history', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const locations = await WorkerLocation.find({ user_id: user._id, date: { $gte: today } }).sort({ timestamp: 1 });
        const activity = await getOrCreateTodayActivity(user._id);
        res.json({
            tracking_active: activity.tracking_active,
            current_location: (activity.current_lat && activity.current_lng) ? { latitude: activity.current_lat, longitude: activity.current_lng } : null,
            location_history: locations.map(l => ({ latitude: l.latitude, longitude: l.longitude, timestamp: l.timestamp, zone: classifyZone(l.latitude, l.longitude) })),
            summary: {
                hours_worked: activity.hours_worked,
                distance_km: activity.distance_travelled,
                zone: activity.zone,
                total_points: activity.gps_count,
                activity_status: activity.status,
                tracking_start_time: activity.tracking_start_time
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tracking-status', auth, async (req, res) => {
    try {
        const activity = await getOrCreateTodayActivity(req.user.id);
        res.json({ tracking_active: activity.tracking_active, current_zone: activity.zone, hours_worked: activity.hours_worked, distance_km: activity.distance_travelled });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/worker-locations', adminAuth, async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const activities = await WorkerActivity.find({ date: { $gte: today }, tracking_active: true });
        const workers = [];
        for (const a of activities) {
            const u = await User.findById(a.user_id);
            if (!u || u.is_admin) continue;
            workers.push({
                user_id: u._id, name: u.name, city: u.city, platform: u.platform,
                latitude: a.current_lat, longitude: a.current_lng, zone: a.zone,
                hours_worked: a.hours_worked, distance_km: a.distance_travelled,
                tracking_since: a.tracking_start_time, total_points: a.gps_count,
                fraud_risk: a.fraud_risk, eligible_for_claim: a.eligible_for_claim
            });
        }
        res.json({ workers, total_active: workers.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// ===================== RISK PREDICTION =====================


app.get('/api/ai/risk', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const cityConfig = await CityTier.findOne({ city: user.city });
        const heatConf = await SystemConfig.findOne({ key: 'heat_threshold' });
        const aqiConf = await SystemConfig.findOne({ key: 'aqi_threshold' });

        const rainThreshold = cityConfig?.rain_trigger || 300;
        const heatThreshold = heatConf?.value || 43;
        const aqiThreshold = aqiConf?.value || 300;

        const weather = await fetchWeather(user.city);
        const forecast = await fetchForecast(user.city);
        
        const rainRisk = Math.min(1, Math.max(0, (forecast.rain_forecast || weather.rain || 0) / rainThreshold));
        const heatRisk = Math.min(1, Math.max(0, (forecast.temp_forecast || weather.temp || 0) / heatThreshold));
        const aqiRisk = Math.min(1, Math.max(0, (forecast.aqi_forecast || weather.aqi || 0) / aqiThreshold));

        let riskScore = (0.4 * rainRisk) + (0.3 * heatRisk) + (0.3 * aqiRisk);
        if (isNaN(riskScore)) riskScore = 0.1; // Safety fallback
        
        let riskLevel = 'Low';
        if (riskScore >= 0.7) riskLevel = 'High';
        else if (riskScore >= 0.4) riskLevel = 'Medium';
        
        await User.updateOne({ _id: user._id }, { risk_score: riskScore, risk_level: riskLevel });

        res.json({
            rain_risk: Math.round(rainRisk * 100),
            heat_risk: Math.round(heatRisk * 100),
            aqi_risk: Math.round(aqiRisk * 100),
            risk_probability: riskScore,
            risk_level: riskLevel
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/risk-prediction', auth, (req, res, next) => { req.url = '/api/ai/risk'; next(); });

app.get('/api/city-tier', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const cityConfig = await CityTier.findOne({ city: user.city });
        const heatConf = await SystemConfig.findOne({ key: 'heat_threshold' });
        const aqiConf = await SystemConfig.findOne({ key: 'aqi_threshold' });
        
        res.json({
            city: user.city,
            tier: user.city_tier,
            thresholds: {
                rain: cityConfig?.rain_trigger || 300,
                temp: heatConf?.value || 43,
                aqi: aqiConf?.value || 300
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/notifications', auth, async (req, res) => {
    try {
        res.json({ notifications: [] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== ADMIN ROUTES =====================

// GET /api/admin/stats
app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const totalWorkers = await User.countDocuments({ is_admin: false });
        const activePolicies = await Policy.countDocuments({ status: 'active' });
        const fraudCases = await Claim.countDocuments({ fraud_score: { $gt: 0.7 } });
        const adminStats = await Admin.findOne();

        const totalPremium = adminStats?.total_premium || 0;
        const totalPayout = adminStats?.total_payout || 0;
        const lossRatio = totalPremium > 0 ? Math.round((totalPayout / totalPremium) * 100) / 100 : 0;

        res.json({
            total_workers: totalWorkers,
            active_policies: activePolicies,
            total_premium: totalPremium,
            total_payout: totalPayout,
            loss_ratio: lossRatio,
            loss_ratio_status: {
                ratio: lossRatio,
                status: lossRatio > 0.85 ? 'Critical' : lossRatio > 0.7 ? 'Warning' : 'Healthy',
                recommendation: lossRatio > 0.85 ? 'Increase premiums or reduce payouts' : lossRatio > 0.7 ? 'Monitor closely' : 'System is profitable'
            },
            fraud_cases: fraudCases,
            enrollment_open: true
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Backward compat
app.get('/api/admin/overview', adminAuth, async (req, res) => {
    try {
        const totalWorkers = await User.countDocuments({ is_admin: false });
        const activePolicies = await Policy.countDocuments({ status: 'active' });
        const fraudCases = await Claim.countDocuments({ fraud_score: { $gt: 0.7 } });
        const adminStats = await Admin.findOne();

        const totalPremium = adminStats?.total_premium || 0;
        const totalPayout = adminStats?.total_payout || 0;
        const lossRatio = totalPremium > 0 ? Math.round((totalPayout / totalPremium) * 100) / 100 : 0;

        res.json({
            total_workers: totalWorkers,
            active_policies: activePolicies,
            total_premium: totalPremium,
            total_payout: totalPayout,
            loss_ratio: lossRatio,
            loss_ratio_status: {
                ratio: lossRatio,
                status: lossRatio > 0.85 ? 'Critical' : lossRatio > 0.7 ? 'Warning' : 'Healthy',
                recommendation: lossRatio > 0.85 ? 'Increase premiums or reduce payouts' : lossRatio > 0.7 ? 'Monitor closely' : 'System is profitable'
            },
            fraud_cases: fraudCases,
            enrollment_open: true
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/cities', adminAuth, async (req, res) => {
    try {
        const cities = await CityTier.find().sort({ tier: 1, city: 1 });
        const result = [];
        for (const c of cities) {
            const workers = await User.countDocuments({ city: c.city, is_admin: false });
            const claimsCount = await Claim.countDocuments();
            // Fetch live weather for each city
            const weather = await fetchWeather(c.city);
            result.push({
                city: c.city,
                tier: c.tier,
                rain_threshold: c.rain_trigger,
                temp_threshold: c.heat_trigger,
                aqi_threshold: c.aqi_trigger,
                current_rain: weather.rain,
                current_temp: weather.temp,
                current_aqi: weather.aqi,
                workers_count: workers,
                claims_count: claimsCount
            });
        }
        res.json({ cities: result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/update-city', adminAuth, async (req, res) => {
    try {
        const { city, tier, rain_threshold, temp_threshold, aqi_threshold } = req.body;
        await CityTier.updateOne({ city }, { tier, rain_trigger: rain_threshold, heat_trigger: temp_threshold, aqi_trigger: aqi_threshold });
        await User.updateMany({ city }, { city_tier: tier });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/fraud', adminAuth, async (req, res) => {
    try {
        const workers = await User.find({ is_admin: false }).sort({ risk_score: -1 });
        const result = [];
        for (const w of workers) {
            const claimCount = await Claim.countDocuments({ user_id: w._id });
            result.push({
                id: w._id,
                full_name: w.name,
                city: w.city,
                fraud_score: w.risk_score,
                risk_level: w.risk_score > 0.6 ? 'High' : w.risk_score > 0.3 ? 'Medium' : 'Low',
                platform: w.platform,
                claims_count: claimCount,
                fraud_status: w.risk_score > 0.7 ? 'Fraud' : w.risk_score > 0.5 ? 'Suspicious' : 'Safe'
            });
        }
        res.json({ workers: result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/block-worker', adminAuth, async (req, res) => {
    try {
        const { worker_id } = req.body;
        await Policy.updateMany({ user_id: worker_id, status: 'active' }, { status: 'cancelled' });
        await User.updateOne({ _id: worker_id }, { risk_score: 1.0 });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/loss-ratio', adminAuth, async (req, res) => {
    try {
        const adminStats = await Admin.findOne();
        const config = await SystemConfig.findOne({ key: 'weekly_premium' });
        const currentPremium = config?.value || 30;

        const totalPremium = adminStats?.total_premium || 0;
        const totalPayout = adminStats?.total_payout || 0;
        const ratio = totalPremium > 0 ? Math.round((totalPayout / totalPremium) * 100) / 100 : 0;
        
        // Loss Ratio action rules
        let status = 'Normal';
        let action = 'No action needed';
        let suggestedPremium = currentPremium;

        if (ratio > 1.0) {
            status = 'Critical';
            action = 'Stop new policies';
            suggestedPremium = currentPremium * 1.5;
        } else if (ratio > 0.8) {
            status = 'Danger';
            action = 'Increase premium';
            suggestedPremium = currentPremium * 1.2;
        } else if (ratio >= 0.6) {
            status = 'Warning';
            action = 'Monitor closely';
        }

        res.json({
            loss_ratio: ratio,
            total_premium: totalPremium,
            total_payout: totalPayout,
            current_premium: currentPremium,
            suggested_premium: Math.round(suggestedPremium),
            status: status,
            action: action
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/update-premium', adminAuth, async (req, res) => {
    try {
        const { premium } = req.body;
        if (!premium) return res.status(400).json({ error: 'Premium amount is required' });
        await SystemConfig.updateOne({ key: 'weekly_premium' }, { $set: { value: premium } }, { upsert: true });
        res.json({ success: true, message: 'Premium configuration updated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/toggle-enrollment', adminAuth, async (req, res) => {
    try {
        res.json({ success: true, enrollment_open: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/trigger-history', adminAuth, async (req, res) => {
    try {
        const history = await Trigger.find().sort({ date: -1 });
        res.json({ history });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/workers', adminAuth, async (req, res) => {
    try {
        const workers = await User.find({ is_admin: false }).sort({ createdAt: -1 });
        const result = [];
        for (const w of workers) {
            const activePolicies = await Policy.countDocuments({ user_id: w._id, status: 'active' });
            const totalClaims = await Claim.countDocuments({ user_id: w._id });
            result.push({
                ...w.toObject(),
                full_name: w.name,
                active_policies: activePolicies,
                total_claims: totalClaims,
                fraud_score: w.risk_score || 0,
                risk_level: (w.risk_score || 0) > 0.6 ? 'High' : (w.risk_score || 0) > 0.3 ? 'Medium' : 'Low'
            });
        }
        res.json({ workers: result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== SIMULATE TRIGGER (admin demo) =====================

app.post('/api/admin/simulate-trigger', adminAuth, async (req, res) => {
    try {
        const { city, trigger_type, value } = req.body;
        const cityConfig = await CityTier.findOne({ city });
        if (!cityConfig) return res.status(404).json({ error: 'City not found' });

        let threshold;
        if (trigger_type === 'Rain') threshold = cityConfig.rain_trigger;
        if (trigger_type === 'Heat') threshold = cityConfig.heat_trigger;
        if (trigger_type === 'AQI') threshold = cityConfig.aqi_trigger;

        if (value > threshold) {
            // Save trigger event
            await Trigger.create({ city, rain: trigger_type === 'Rain' ? value : 0, temperature: trigger_type === 'Heat' ? value : 0, aqi: trigger_type === 'AQI' ? value : 0, trigger_status: true, date: new Date() });

            // Find active policies in this city
            const workers = await User.find({ city, is_admin: false });
            let claimsPaid = 0;

            for (const w of workers) {
                const policy = await Policy.findOne({ user_id: w._id, status: 'active' });
                if (!policy) continue;

                const activities = await Activity.find({ user_id: w._id }).sort({ date: -1 }).limit(7);
                const activeDays = activities.filter(a => a.activity_status === 'Active').length;
                const totalHours = activities.reduce((s, a) => s + a.hours_worked, 0);
                const workerActive = activeDays >= 3 && totalHours >= 15;

                const fraudResult = await callAI('/ai/fraud-score', { user_id: w._id, trigger_type, trigger_value: value });
                const approved = workerActive && fraudResult.fraud_score < 0.7;

                await Claim.create({
                    user_id: w._id,
                    trigger_type,
                    trigger_value: value,
                    payout: approved ? policy.payout : 0,
                    status: approved ? 'paid' : 'rejected',
                    fraud_score: fraudResult.fraud_score,
                    date: new Date()
                });

                if (approved) {
                    claimsPaid++;
                    await Admin.updateOne({}, { $inc: { total_payout: policy.payout } });
                }
            }

            // Update loss ratio
            const adminStats = await Admin.findOne();
            if (adminStats && adminStats.total_premium > 0) {
                adminStats.loss_ratio = Math.round((adminStats.total_payout / adminStats.total_premium) * 100) / 100;
                await adminStats.save();
            }

            res.json({ success: true, triggered: true, claims_paid: claimsPaid, loss_ratio: adminStats?.loss_ratio || 0 });
        } else {
            res.json({ success: true, triggered: false, message: `Value ${value} below threshold ${threshold}` });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ===================== CRON: Trigger Engine (Every Hour) =====================

cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running hourly trigger check...');
    try {
        const cities = await CityTier.find();

        for (const cityConfig of cities) {
            const weather = await fetchWeather(cityConfig.city);

            const rainTriggered = weather.rain > cityConfig.rain_trigger;
            const heatTriggered = weather.temp > cityConfig.heat_trigger;
            const aqiTriggered = weather.aqi > cityConfig.aqi_trigger;

            if (rainTriggered || heatTriggered || aqiTriggered) {
                const triggerType = rainTriggered ? 'Rain' : heatTriggered ? 'Heat' : 'AQI';
                const triggerValue = rainTriggered ? weather.rain : heatTriggered ? weather.temp : weather.aqi;

                // Save trigger event
                await Trigger.create({
                    city: cityConfig.city,
                    rain: weather.rain,
                    temperature: weather.temp,
                    aqi: weather.aqi,
                    trigger_status: true,
                    date: new Date()
                });

                // Process claims for all eligible workers in this city
                const workers = await User.find({ city: cityConfig.city, is_admin: false });

                for (const worker of workers) {
                    const policy = await Policy.findOne({ user_id: worker._id, status: 'active' });
                    if (!policy) continue;

                    const activities = await Activity.find({ user_id: worker._id }).sort({ date: -1 }).limit(7);
                    const activeDays = activities.filter(a => a.activity_status === 'Active').length;
                    const totalHours = activities.reduce((s, a) => s + a.hours_worked, 0);
                    const workerActive = activeDays >= 3 && totalHours >= 15;

                    if (!workerActive) continue;

                    const fraudResult = await callAI('/ai/fraud-score', { user_id: worker._id, trigger_type: triggerType });
                    if (fraudResult.fraud_score >= 0.7) continue;

                    // Approved -- create claim
                    await Claim.create({
                        user_id: worker._id,
                        trigger_type: triggerType,
                        trigger_value: triggerValue,
                        payout: policy.payout,
                        status: 'paid',
                        fraud_score: fraudResult.fraud_score,
                        date: new Date()
                    });

                    await Admin.updateOne({}, { $inc: { total_payout: policy.payout } });
                }

                // Update loss ratio
                const adminStats = await Admin.findOne();
                if (adminStats && adminStats.total_premium > 0) {
                    adminStats.loss_ratio = Math.round((adminStats.total_payout / adminStats.total_premium) * 100) / 100;
                    await adminStats.save();
                }

                console.log(`[CRON] Trigger detected in ${cityConfig.city}: ${triggerType} = ${triggerValue}`);
            }
        }

        console.log('[CRON] Trigger check complete.');
    } catch (err) {
        console.error('[CRON] Trigger engine error:', err.message);
    }
});


// ===================== PAGES =====================

const pages = ['index', 'register', 'login', 'dashboard', 'buy-policy', 'active-policy', 'trigger-monitor', 'claims', 'activity', 'location-tracker', 'terms', 'admin'];
pages.forEach(page => {
    const route = page === 'index' ? '/' : `/${page}`;
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', `${page}.html`)));
});


// ===================== START SERVER =====================

async function startServer() {
    try {
        // Step 1: Connect to MongoDB first
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Step 2: Seed essential data
        await seedDatabase();
        console.log('Database seeding complete');

        // Step 3: Start Express server
        app.listen(PORT, () => {
            console.log(`\nGigShield AI running at http://localhost:${PORT}`);
            console.log(`Admin Login: admin@gigshield.ai / admin123\n`);
        });
    } catch (err) {
        console.error('Startup failed:', err.message);
        process.exit(1);
    }
}

startServer();
