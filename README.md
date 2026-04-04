# GigShield AI

## AI-Powered Parametric Income Protection for Gig Workers

GigShield AI is a parametric micro-insurance platform designed to protect gig delivery workers such as Zomato, Swiggy, Zepto, Dunzo, and Amazon delivery partners from income loss caused by extreme environmental conditions like heavy rain, heatwaves, and high air pollution.

Unlike traditional insurance, GigShield AI automatically triggers payouts when predefined environmental thresholds are crossed — no claims, no paperwork, and no delays.

---

# Default Admin Login

| Email                                           | Password |
| ----------------------------------------------- | -------- |
| [admin@gigshield.ai](mailto:admin@gigshield.ai) | admin123 |

Use this account to access the Admin Dashboard, simulate triggers, monitor loss ratio, and manage the system.

---

# The Problem

Gig delivery workers work in outdoor conditions and are highly affected by environmental disruptions such as:

* Heavy Rain
* Extreme Heat (45°C+)
* Floods
* High AQI / Air Pollution

When these events occur, workers cannot complete deliveries and may lose 20–30% of their weekly income.
Currently, there is no structured income protection system for gig workers.

Traditional insurance does not work because:

* Claims take weeks to process
* Requires paperwork
* Not designed for daily wage workers
* Covers accidents/health, not income loss

This creates a major financial protection gap.

---

# The Solution — Parametric Insurance

GigShield AI uses a Parametric Insurance Model.

Parametric insurance pays money when a trigger event happens, instead of checking actual loss.

Example:

* If rainfall > threshold → payout triggered
* If temperature > threshold → payout triggered
* If AQI > threshold → payout triggered

This allows:

* Instant payouts
* No claim process
* Fully automated system
* Low-cost micro-premium model (₹30/week)

---

# System Overview

GigShield AI consists of three main components:

| Component    | Technology              |
| ------------ | ----------------------- |
| Frontend     | HTML, CSS, JavaScript   |
| Backend      | Node.js, Express        |
| AI Service   | Python (Scikit-learn)   |
| Database     | MongoDB                 |
| Maps         | Leaflet + OpenStreetMap |
| Weather Data | OpenWeather API         |
| Automation   | node-cron               |

---

# Project Structure

```
GigShield-AI/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── python_service/
│   │   ├── app.py
│   │   ├── risk_model.py
│   │   ├── fraud_model.py
│   │   └── requirements.txt
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── admin.html
│   ├── css/
│   ├── js/
│   └── images/
│
└── README.md
```

---

# How to Run the Project Locally

To run the GigShield AI project locally, you need to start:

1. Node.js Backend
2. Python AI Service
3. Frontend (served by backend)

Follow the steps below carefully.

---

# 1. Prerequisites

Make sure you have the following installed:

| Software | Version                |
| -------- | ---------------------- |
| Node.js  | v16 or higher          |
| Python   | v3.8 or higher         |
| npm      | Comes with Node.js     |
| pip      | Comes with Python      |
| MongoDB  | Local or MongoDB Atlas |

---

# 2. Setup and Run the Backend (Node.js)

The backend manages:

* Database
* Authentication
* Policies
* Claims
* Weather triggers
* Serves frontend

Step 1 — Go to backend folder

```bash
cd backend
```

Step 2 — Install dependencies

```bash
npm install
```

Step 3 — Environment Variables

Create a `.env` file inside `backend/`:

```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENWEATHER_API_KEY=your_openweather_api_key
AI_SERVICE_URL=http://localhost:5000
```

Step 4 — Start Backend Server

```bash
npm start
```

Backend will start at:

```
http://localhost:3000
```

Frontend is automatically served by backend.

---

# 3. Setup and Run the AI Service (Python)

The AI service handles:

* Risk Scoring
* Fraud Detection
* Premium Prediction

Step 1 — Open new terminal

```bash
cd backend/python_service
```

Step 2 — Install Python dependencies

```bash
pip install -r requirements.txt
```

Step 3 — Start AI Service

```bash
python app.py
```

AI service will run at:

```
http://localhost:5000
```

---

# 4. Access the Application

Once both backend and AI service are running:

Open browser:

```
http://localhost:3000
```

You can now:

* Register as Worker
* Login as Worker
* Login as Admin
* Buy Policy
* Track Weather Risk
* Simulate Triggers (Admin)
* View Loss Ratio Dashboard

---

# Summary of Ports

| Service       | URL                       | Description       |
| ------------- | ------------------------- | ----------------- |
| Main Web App  | http://localhost:3000     | Frontend          |
| Backend API   | http://localhost:3000/api | Node.js Backend   |
| AI ML Service | http://localhost:5000     | Python AI Service |

---

# How Automation Works

The system runs an automated job using node-cron.

Every hour:

1. Fetch Weather Data
2. Fetch AQI Data
3. Check Trigger Conditions
4. Find Active Policies
5. Run Fraud Detection
6. Trigger Payout
7. Update Loss Ratio
8. Update Dashboard

This makes the system fully automated.

---

# Core System Models

## Parametric Trigger Model

| Trigger | Condition                 |
| ------- | ------------------------- |
| Rain    | Rainfall > Tier Threshold |
| Heat    | Temperature > 43°C        |
| AQI     | AQI > 300                 |

| City Tier | Rain Trigger |
| --------- | ------------ |
| Tier 1    | 300 mm       |
| Tier 2    | 150 mm       |
| Tier 3    | 80 mm        |

---

## Risk Score Model

| Risk Score | Risk Level |
| ---------- | ---------- |
| < 0.4      | Low        |
| 0.4 – 0.7  | Medium     |
| > 0.7      | High       |

Used for:

* Premium pricing
* Risk alerts
* Trigger prediction

---

## Fraud Detection Model

Fraud indicators:

* Low working hours
* Low distance travelled
* No GPS activity
* Claim made while inactive

Model Used:
Isolation Forest Algorithm

If Fraud Score > 0.7 → Claim flagged.

---

## Actuarial Model — Loss Ratio

Loss Ratio = Claims Paid / Premium Collected

| Loss Ratio | Action            |
| ---------- | ----------------- |
| < 0.6      | Sustainable       |
| 0.6 – 0.8  | Monitor           |
| > 0.8      | Increase Premium  |
| > 1.0      | Stop New Policies |

---

# What This Project Demonstrates

This project demonstrates real-world concepts from:

* Insurance Technology (InsurTech)
* Parametric Insurance
* Risk Modeling
* Actuarial Science
* Fraud Detection using Machine Learning
* Full Stack Development
* Real-time Data Systems
* Automation Systems

---

# Challenges Faced

* Designing fair environmental trigger thresholds
* Preventing fraud using GPS data
* Maintaining sustainable loss ratio
* Integrating Weather APIs + GPS + AI models
* Database migration (SQLite to MongoDB)
* Designing system like real insurance product

---

# Conclusion

GigShield AI is a Parametric Micro-Insurance Platform designed for gig workers that combines:

* AI/ML
* Weather Data
* GPS Tracking
* Risk Modeling
* Actuarial Pricing
* Automated Payout System

to provide automatic income protection during environmental disruptions.

This project shows how technology can be used to build financial protection systems for the gig economy.

---

# Contributors

Built during AI Hackathon to solve a real-world gig economy problem.
