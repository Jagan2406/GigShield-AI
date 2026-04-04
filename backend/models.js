const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: { type: String, unique: true },
  password: String,
  city: String,
  platform: String,
  vehicle: String,
  weekly_income: Number,
  work_hours: Number,
  documents: {
    id_proof: String,
    platform_screenshot: String,
    earnings_screenshot: String
  },
  city_tier: Number,
  risk_score: Number,
  is_admin: { type: Boolean, default: false }
}, { timestamps: true });

const policySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  premium: Number,
  payout: Number,
  start_date: Date,
  end_date: Date,
  city_tier: Number,
  status: { type: String, default: 'active' }
}, { timestamps: true });

const triggerSchema = new mongoose.Schema({
  city: String,
  rain: Number,
  temperature: Number,
  aqi: Number,
  trigger_status: Boolean,
  date: Date
}, { timestamps: true });

const claimSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trigger_type: String,
  trigger_value: Number,
  payout: Number,
  status: { type: String, default: 'processing' },
  fraud_score: Number,
  date: Date
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  hours_worked: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  distance_travelled: { type: Number, default: 0 },
  gps_lat: Number,
  gps_lng: Number,
  zone: { type: String, default: 'Unknown' },
  activity_status: { type: String, default: 'Inactive' },
  tracking_active: { type: Boolean, default: false },
  tracking_start_time: Date,
  location_history: [{
    latitude: Number,
    longitude: Number,
    timestamp: { type: Date, default: Date.now },
    zone: String
  }]
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  total_premium: { type: Number, default: 0 },
  total_payout: { type: Number, default: 0 },
  loss_ratio: { type: Number, default: 0 }
}, { timestamps: true });

const cityTierSchema = new mongoose.Schema({
  city: String,
  tier: Number,
  rain_trigger: Number
});

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed
});

const workerLocationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
  date: { type: Date, default: () => { const d = new Date(); d.setHours(0,0,0,0); return d; } }
}, { timestamps: true });

const workerActivitySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: () => { const d = new Date(); d.setHours(0,0,0,0); return d; } },
  hours_worked: { type: Number, default: 0 },
  distance_travelled: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Inactive' },
  eligible_for_claim: { type: String, enum: ['Yes', 'No'], default: 'No' },
  fraud_risk: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  tracking_active: { type: Boolean, default: false },
  tracking_start_time: Date,
  last_gps_time: Date,
  current_lat: Number,
  current_lng: Number,
  zone: { type: String, default: 'Unknown' },
  gps_count: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Policy = mongoose.model('Policy', policySchema);
const Trigger = mongoose.model('Trigger', triggerSchema);
const Claim = mongoose.model('Claim', claimSchema);
const Activity = mongoose.model('Activity', activitySchema);
const Admin = mongoose.model('Admin', adminSchema);
const CityTier = mongoose.model('CityTier', cityTierSchema);
const WorkerLocation = mongoose.model('WorkerLocation', workerLocationSchema);
const WorkerActivity = mongoose.model('WorkerActivity', workerActivitySchema);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

module.exports = { User, Policy, Trigger, Claim, Activity, Admin, CityTier, WorkerLocation, WorkerActivity, SystemConfig };
