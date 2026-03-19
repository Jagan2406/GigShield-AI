# GigShield AI – Project Structure

## Overview

This document describes the folder structure and organization of the GigShield AI project. A well-defined project structure helps maintain clarity, scalability, and maintainability as the platform evolves.

The structure separates frontend, backend, AI models, documentation, and configuration files to ensure modular development.

---

## Project Directory Structure

GigShield-AI/
│
├── README.md
├── architecture.md
├── workflow.md
├── project-structure.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── App.js
│   │
│   └── package.json
│
├── backend/
│   ├── app.py
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── requirements.txt
│
├── ai-models/
│   ├── premium_prediction.py
│   ├── fraud_detection.py
│   └── risk_analysis.py
│
├── database/
│   ├── schema.md
│   └── sample_data.json
│
├── api-integrations/
│   ├── weather_api.py
│   ├── aqi_api.py
│   └── disruption_monitor.py
│
└── payment-simulation/
    └── payout_simulator.py

---

## Folder Description

### Root Directory

The root directory contains the main documentation and entry points for the project.

Key files include:

* **README.md** – Project overview and description
* **architecture.md** – System architecture explanation
* **workflow.md** – Operational workflow of the platform
* **project-structure.md** – Documentation of project folder structure

---

### Frontend

The frontend folder contains the user interface of the platform.

Responsibilities include:

* Worker registration and login
* Viewing insurance plans
* Dashboard for claims and payouts
* Policy activation and premium payment interface

Technologies used:

* React.js
* HTML
* CSS
* JavaScript

---

### Backend

The backend handles the core business logic and communication with external systems.

Responsibilities include:

* User authentication
* Policy management
* Claim processing
* API integration
* Communication with AI models

Technologies used:

* Python
* Flask or FastAPI

---

### AI Models

The AI models folder contains machine learning components responsible for risk prediction and fraud detection.

Example modules include:

* **premium_prediction.py** – Calculates weekly insurance premiums
* **fraud_detection.py** – Detects suspicious claim activity
* **risk_analysis.py** – Analyzes environmental disruption risks

---

### Database

This folder contains database-related documentation and sample structures.

It may include:

* Database schema definitions
* Sample datasets
* Data structure documentation

Recommended databases:

* MongoDB
* PostgreSQL

---

### API Integrations

This module handles communication with external data sources required for disruption detection.

Example integrations include:

* Weather monitoring APIs
* Air quality monitoring APIs
* Environmental disruption data sources

These APIs provide the data needed to activate parametric insurance triggers.

---

### Payment Simulation

The payment simulation module demonstrates how payouts would be processed.

During development, payments can be simulated using:

* Razorpay sandbox
* UPI test environment

This module shows how affected workers would receive compensation when disruptions occur.

---

## Benefits of the Project Structure

This modular project structure provides several advantages:

* Clear separation of frontend and backend components
* Easy integration of AI models
* Scalable architecture for future expansion
* Improved code maintainability
* Better collaboration among development team members

---

## Summary

The GigShield AI project structure is designed to support a scalable and modular development environment.

By organizing components into clear directories for frontend, backend, AI models, APIs, and documentation, the project becomes easier to maintain, expand, and deploy as the platform evolves.
