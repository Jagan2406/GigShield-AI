# 🚀 GigShield AI  
AI-Powered Parametric Income Protection for Gig Delivery Workers

---

## 🔍 Overview

GigShield AI is an AI-powered parametric insurance platform designed to protect gig delivery workers from income loss caused by external disruptions such as extreme weather, pollution, and local restrictions.

Delivery partners working with platforms like Zomato and Swiggy rely entirely on active working hours to earn income. However, conditions like heavy rainfall, extreme heat, and high pollution levels can significantly reduce deliveries or halt operations entirely.

These disruptions can lead to 20–30% loss in weekly income, and currently, there is no protection system in place.

GigShield AI provides a fully automated, zero-claim insurance system that detects disruptions in real time and instantly compensates workers for lost income.

---

## 🎯 Target Persona

Food Delivery Workers (Urban Areas)

- Platforms: Zomato, Swiggy  
- Location: Urban cities (e.g., Vijayawada)  
- Daily Earnings: ₹600 – ₹1200  
- Working Hours: 8–10 hours/day  
- Payment Cycle: Weekly  
- Work Nature: Outdoor, highly disruption-sensitive  

---

## ⚠️ Problem Statement

Gig delivery workers frequently lose income due to uncontrollable external factors:

- Heavy rainfall reducing delivery demand  
- Extreme heat limiting working hours  
- Flooded roads blocking routes  
- High pollution making outdoor work unsafe  
- Sudden curfews or zone closures  

These events directly impact their ability to earn, yet no system exists to compensate for lost income.

Traditional insurance is not suitable because:
- It focuses on health, life, or vehicles  
- Requires manual claims  
- Has slow processing times  

---

## 💡 Proposed Solution

GigShield AI introduces a parametric, AI-driven insurance model:

Instead of manual claims, payouts are triggered automatically when predefined external conditions are met.

### 🔄 System Workflow

1. Worker registers and provides location + income data  
2. AI calculates personalized weekly premium  
3. Worker activates weekly coverage plan  
4. System continuously monitors external data (weather, AQI, etc.)  
5. Disruption occurs → system detects trigger  
6. Affected workers are identified  
7. Claims are automatically generated  
8. Fraud checks are applied  
9. Instant payout is processed  

---

## 💰 Weekly Premium Model

GigShield AI follows a weekly subscription model aligned with gig workers’ earning cycles.

### 📊 Plans

| Plan        | Weekly Premium | Max Coverage |
|------------|---------------|-------------|
| Basic      | ₹20           | ₹300        |
| Standard   | ₹35           | ₹600        |
| Premium    | ₹50           | ₹1000       |

---

## 📈 Dynamic Pricing (AI-Based)

Premiums are dynamically adjusted based on risk:

Risk Score Formula:

Risk Score =  
( Rain Probability × 0.4 ) +  
( Heat Index × 0.3 ) +  
( AQI Risk × 0.2 ) +  
( Flood Risk × 0.1 )

Final Premium = Base Premium + (Risk Score × Multiplier)

This ensures:
- Fair pricing  
- Location-specific premiums  
- Better risk management  

---

## ⚡ Parametric Disruption Triggers

Payouts are automatically triggered based on measurable conditions.

### 🌧 Environmental Triggers

| Disruption       | Condition                              | Payout |
|-----------------|----------------------------------------|--------|
| Heavy Rain      | Rainfall > 40mm within 3 hours         | ₹150   |
| Extreme Heat    | Temperature > 42°C for 2+ hours        | ₹100   |
| Severe Pollution| AQI > 300 for 6+ hours                 | ₹120   |
| Flood Alert     | Official flood warning in region       | ₹200   |

---

## 💸 Payout Rules

- Each disruption event triggers partial payout
- Total payout is capped by weekly plan
- Multiple events allowed within a week

### Example:
Standard Plan (₹600 max):
- Rain → ₹150  
- Heat → ₹100  
- Pollution → ₹120  

Total = ₹370 (within cap)

---

## 🤖 AI & Machine Learning Integration

### 1. Risk Prediction
- Predicts disruption probability using historical data  
- Identifies high-risk zones  

### 2. Dynamic Premium Adjustment
- Adjusts weekly premium based on predicted risk  

### 3. Fraud Detection

Advanced fraud prevention mechanisms:

- GPS + Weather Sync Check  
  Claim valid only if worker is in affected zone  

- Activity Validation  
  Worker must be active (recent deliveries)  

- Pattern Analysis  
  Detect abnormal claim frequency  

- Cluster Detection  
  Identify multiple fake claims from same device/location  

---

## 🧱 Technology Stack

### Frontend
- React.js  
- HTML, CSS, JavaScript  

### Backend
- Python  
- Flask / FastAPI  

### Database
- PostgreSQL / MongoDB  

### APIs
- Weather API (rainfall, temperature)  
- AQI API  
- Mock APIs for simulation  

### Payments (Simulation)
- Razorpay sandbox  
- UPI test environment  

---

## 📊 Analytics Dashboard

### 👤 Worker Dashboard
- Active coverage  
- Earnings protected  
- Claim history  
- Payout records  

### 🛠 Admin Dashboard
- Active users  
- Total policies  
- Disruption heatmaps  
- Claim statistics  
- Fraud alerts  
- Risk predictions  

---

## 📌 Financial Sustainability

- Weekly premium pool collected from all users  
- Not all users claim simultaneously  
- AI adjusts pricing during high-risk periods  
- Payout caps prevent excessive losses  

Target Loss Ratio: < 70%

---

## 📍 Example Scenario

Location: Vijayawada  
Plan: Standard (₹35/week)

Week Events:
- Heavy Rain → ₹150  
- High AQI → ₹120  

Total Payout: ₹270

Worker receives compensation automatically without filing a claim.

---

## 👥 Team

Team Name: Syntax Error  

---

## 🔮 Future Scope

- Integration with delivery platforms (real-time data)  
- Hyperlocal AI risk prediction  
- Mobile app for workers  
- Advanced fraud detection models  
- Blockchain-based claim transparency  

---

## ✅ Conclusion

GigShield AI creates a financial safety net for gig workers by protecting their income against uncontrollable disruptions.

By combining:
- AI-driven risk modeling  
- Parametric triggers  
- Automated payouts  

the platform delivers a scalable, fast, and fair insurance solution tailored for the gig economy.

---
