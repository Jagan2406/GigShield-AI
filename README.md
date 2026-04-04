# 🚀 GigShield AI

**AI-Powered Parametric Income Protection for Gig Delivery Workers**
**Watch our Phase 1 Pitch & Demo Video Here  https://youtu.be/WuMDSCI0Moc**

# 🛡️ GigShield AI: The Parametric Defense Protocol

> **Deep-Tech Parametric Income Protection for the Logistics & Gig Economy**  
> An autonomous, AI-powered weather derivative platform protecting Zomato, Swiggy, Zepto, and independent delivery partners from systemic, unforeseen climate disruptions.

---

## 🚀 Executive Summary
**GigShield AI** is not a standard CRUD application; it is an autonomous risk-transfer engine. We have built an end-to-end parametric micro-insurance platform tailored for the Global South's freelance delivery workforce. By removing human claim adjusters and replacing them with realtime algorithmic environment tracking (Weather & Air Quality nodes), we guarantee instant, trustless payouts directly via UPI the moment a climate threshold is breached.

## 🌧️ The Core Problem
India's 15 million+ gig workers operate without a financial safety net. When systemic environmental anomalies occur (floods, 45°C heatwaves, 450+ AQI pollution blocks), riders face an impossible paradox: **Risk irreversible health damage/death, or lose your daily survival wage.**

Traditional indemnity insurance fundamentally fails this demographic:
*   Requires massive paperwork.
*   Takes weeks to process claims.
*   Geared strictly towards asset protection (accidents/health) rather than **preventative income protection**.

## ⚡ The Parametric Insurance Paradigm
Instead of indemnifying a specific loss (e.g., proving you got sick), GigShield uses **Parametrics**. 
A parametric policy pays out based entirely on an *objective trigger event*. If Node X (OpenWeather API) reports that City Y has breached >150mm of rainfall in 24 hours, the smart engine cross-references the active policy ledger and instantly disperses funds. 

**Advantages:**
1. **Zero Moral Hazard:** The worker cannot cause the rain to fall. Therefore, claims cannot be entirely fabricated.
2. **Instant Settlement:** No adjusters wait at a desk. Settlement time moves from 30 days to 2 seconds.
3. **Hyper-Low Overhead:** Fully automated architecture enables us to drive premiums down to micro-levels (₹30 weekly).

---

## 🔬 Deep Dive: System Architecture & Algorithms

GigShield AI integrates three distinctly powerful pipelines to manage risk safely.

### 4.1 Actuarial Engineering & Loss Ratio Constraints
Insurance fails if the capital pool runs dry. GigShield implements a live actuarial dashboard that monitors the **Loss Ratio** `(Claims Paid + Adjustment Expenses) / Earned Premium`.
*   If the Loss Ratio spirals > 80%, the system utilizes an automated algorithm to suggest higher baseline premiums or halts new enrollments dynamically.
*   We simulate heavy-tail weather events (like monsoon floods) directly via the Admin panel to stress-test our risk reserves.

### 4.2 Isolation Forest Fraud Detection
Even with parametric data, fraud vectors exist (e.g., workers faking their GPS location using spoofers to jump into a city currently experiencing a payout event). 
*   **The AI Layer:** We use simulated `Isolation Forest` anomaly detection algorithms. The system analyzes the worker's historical delivery vector (Distance Traveled, Time Online, Platform utilized).
*   If a worker suddenly spawns in a "Trigger Zone" with 0 surrounding active delivery hours, the algorithm flags a high **Fraud Score** (>0.70) and systematically suspends the payout queue for manual Admin review.

### 4.3 Dynamic K-Means Pricing & Risk Tiers
Not all cities flood equally. Delhi's drainage handles 50mm differently than Mumbai's.
*   We classify cities into **Tiers (1, 2, 3)** using dynamic modeling thresholds.
*   A user logging in from a Tier 1 (High Risk) zone faces differing threshold limits. For example, Tier 1 is >300mm to trigger a payout, whereas Tier 3 triggers at >80mm. 

### 4.4 Micro-Geofencing & GPS Verification
To enforce strict policy validity, we implemented a simulated **Proof-of-Active-Shift** mapping console.
Workers must log physical movement via the `Location Tracker` interface. GPS data generates a heatmap trail, verifying that a rider was genuinely exposed to the hostile climate event rather than purchasing a policy while already safe at home.

---

## ⚙️ The Automation Matrix: Claim Lifecycle

1. **Policy Purchase:** Worker inputs UPI and validates location. The system executes a `POST /api/buy-policy`, logging a 7-day Unix timestamp expiration.
2. **Cron Monitoring:** The backend routinely polls OpenWeather / AQI Data nodes.
3. **Threshold Breach:** A 46°C heatwave is registered in City A.
4. **Ledger Query:** The database selects all active policies localized to `City A` where `policy.status == 'Active'`.
5. **Fraud Sieve:** Selected workers are passed through the anomaly detection check.
6. **Disbursement:** Valid nodes are instantly pushed to the `payout` array, finalizing the claim pipeline with a definitive success receipt.

---

## 🗄️ Database Schema & Ledger Design

Our NoSQL architecture natively supports unstructured location and multi-tiered thresholds. Key schemas include:

**`Worker Schema`**
```json
{
  "_id": "uuid",
  "full_name": "string",
  "city": "string",
  "city_tier": "int",
  "fraud_score": "float",
  "gps_history": [{ "lat": 17.3, "lng": 78.4, "timestamp": "ISO" }]
}

