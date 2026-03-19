from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import requests
import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

# Import simulation modules
from modules.risk_engine import risk_engine
from modules.trigger_monitor import trigger_monitor
from modules.fraud_detection import fraud_system
from modules.payout_simulator import payout_simulator
from models import db, User, Claim, Notification

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:Jagan322@localhost:5432/gigshield"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()


# --- Mock Database for UI Simulation ---
MOCK_WORKER = {
    "id": "W-9921",
    "name": "Rahul Verma",
    "platform": "Zomato",
    "city": "Mumbai",
    "active_subscription": True
}

# --- API Endpoints ---

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "GigShield AI Engine"})

@app.route('/api/dashboard/<worker_id>', methods=['GET'])
def get_worker_dashboard(worker_id):
    """Returns data for the worker dashboard."""
    # 1. Get current environmental risks for their city
    # In a real app, this would use their GPS mapping
    location_data = {"weather_risk": 1.2, "social_risk": 1.0} 
    
    # 2. Calculate Premium
    premium_data = risk_engine.calculate_weekly_premium(worker_id, location_data)
    
    # 3. Check for active triggers in their area
    active_triggers = trigger_monitor.check_triggers("Mumbai")

    # 4. Fetch claim history from PostgreSQL
    claims = Claim.query.filter_by(worker_id=worker_id).order_by(Claim.created_at.desc()).all()
    recent_claims = [
        {
            "id": c.id,
            "worker_id": c.worker_id,
            "city": c.city,
            "trigger_type": c.trigger_type,
            "payout": c.payout,
            "status": c.status,
            "reason": getattr(c, 'reason', ''),
            "timestamp": c.created_at.isoformat() if c.created_at else None
        } for c in claims
    ]

    # 5. Fetch genuine notifications from PostgreSQL
    notifications = Notification.query.filter_by(user_id=worker_id).order_by(Notification.created_at.desc()).all()
    recent_notifications = [
        {
            "id": n.id,
            "title": n.message.split(' - ')[0] if ' - ' in n.message else "Update",
            "desc": n.message,
            "time": n.created_at.isoformat() if n.created_at else None
        } for n in notifications
    ]

    return jsonify({
        "worker": MOCK_WORKER,
        "premium_details": premium_data,
        "active_triggers": active_triggers,
        "claims": recent_claims,
        "notifications": recent_notifications
    })

@app.route('/api/claim', methods=['POST'])
def submit_claim():
    """Handles a claim submission when a trigger event happens."""
    data = request.json
    worker_id = data.get('worker_id', 'W-9921')
    event_type = data.get('event_type', 'Heavy Rain')
    location_coords = {"lat": 19.0760, "lng": 72.8777} # Mocking valid coords
    
    # 1. Fraud Check
    fraud_result = fraud_system.analyze_claim(worker_id, location_coords, event_type)
    
    if fraud_result['is_fraud']:
        print(f"Fraud risk detected but allowing claim during testing. Flags: {fraud_result['flags']}")
        # In the future, this can be re-enabled to actually block suspicious claims
        
    # 3. Handle validations
    city = data.get('city', 'Unknown')
    
    # 4. Create initial claim record with Pending status (placeholder for type and amount)
    new_claim = Claim(
        worker_id=worker_id,
        city=city,
        trigger_type="Evaluating...",
        payout=0.0,
        status="Pending",
        reason="Checking conditions..."
    )
    db.session.add(new_claim)
    db.session.commit()

    # 5. Check environmental conditions and update the claim
    status = "Checking"
    reason = ""
    amount = 0.0
    final_event_type = "None"
    
    try:
        OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
        if not OPENWEATHER_API_KEY:
            # Fallback mock data when API key is missing
            weather_data = {
                "main": {"temp": 43},
                "rain": {"1h": 45},
                "coord": {"lat": 19.0760, "lon": 72.8777}
            }
            aqi = 350
        else:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
            res = requests.get(url)
            weather_data = res.json()
            
            coord = weather_data.get('coord')
            aqi = 50
            if coord:
                lat = coord.get('lat')
                lon = coord.get('lon')
                aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
                aqi_res = requests.get(aqi_url)
                aqi_data = aqi_res.json()
                if 'list' in aqi_data and len(aqi_data['list']) > 0:
                    aqi_index = aqi_data['list'][0]['main']['aqi']
                    aqi_map = {1: 50, 2: 100, 3: 200, 4: 300, 5: 400}
                    aqi = aqi_map.get(aqi_index, 50)
        
        temp = weather_data.get('main', {}).get('temp', 0)
        rain_data = weather_data.get('rain', {})
        rain = rain_data.get('1h', 0)
        
        # Evaluate systematically
        if rain > 40:
            status = "Approved"
            final_event_type = "Heavy Rain"
            amount = 450.0
            reason = f"Rainfall in {city} exceeded 40mm."
        elif temp > 42:
            status = "Approved"
            final_event_type = "Extreme Heat"
            amount = 350.0
            reason = f"Temperature in {city} exceeded 42°C."
        elif aqi > 300:
            status = "Approved"
            final_event_type = "Severe Pollution"
            amount = 300.0
            reason = f"Severe pollution detected in {city}. AQI > 300."
        else:
            status = "Rejected"
            final_event_type = "None"
            amount = 0.0
            reason = "No environmental disruption detected."
            
    except Exception as e:
        status = "Pending"
        reason = "Weather verification failed, pending admin review."
        aqi = 50
        final_event_type = "Pending Evaluation"

    # Update claim to final verified result
    new_claim.status = status
    new_claim.reason = reason
    new_claim.trigger_type = final_event_type
    new_claim.payout = amount
    db.session.commit()
    
    # 5. Insert notification
    if status == "Approved":
        msg = "Claim Approved — your payout will be credited within 3-6 hours."
    elif status == "Rejected":
        msg = f"Claim Rejected — {reason}"
    else:
        msg = "Claim Submitted — awaiting admin verification."
        
    notif = Notification(user_id=worker_id, message=msg)
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        "status": status,
        "reason": reason,
        "payout": amount,
        "city": city,
        "trigger": final_event_type,
        "aqi": aqi,
        "timestamp": new_claim.created_at.isoformat() if new_claim.created_at else None
    })

@app.route('/api/admin/verify_claim', methods=['POST'])
def verify_claim():
    """Endpoint for admin to approve or reject a claim."""
    data = request.json
    claim_id = data.get('claim_id')
    action = data.get('action') # 'approve' or 'reject'

    claim = Claim.query.get(claim_id)
    if not claim:
        return jsonify({"message": "Claim not found"}), 404

    if action == 'approve':
        claim.status = "Approved"
        msg = "Claim Approved - your payout will be credited within 3-6 hours."
    elif action == 'reject':
        claim.status = "Rejected"
        reason = data.get('reason', 'Verification failed.')
        msg = f"Claim Rejected - {reason}"
    else:
        return jsonify({"message": "Invalid action"}), 400

    notif = Notification(user_id=claim.worker_id, message=msg)
    db.session.add(notif)
    db.session.commit()

    return jsonify({"message": f"Claim {action}d successfully", "claim_id": claim.id})

@app.route('/api/admin', methods=['GET'])
def get_admin_dashboard():
    """Returns analytics data for the admin dashboard."""
    # Fetch real claims from PostgreSQL
    all_claims = Claim.query.order_by(Claim.created_at.desc()).all()
    claims_list = [
        {
            "id": c.id,
            "worker_id": c.worker_id,
            "city": c.city,
            "trigger_type": c.trigger_type,
            "payout": c.payout,
            "status": c.status,
            "reason": getattr(c, 'reason', ''),
            "timestamp": c.created_at.isoformat() if c.created_at else None
        } for c in all_claims
    ]

    return jsonify({
        "total_insured_workers": 12450,
        "active_disruptions": len(trigger_monitor.active_events),
        "claims_today": len([c for c in all_claims]),
        "fraud_alerts_today": random.randint(5, 20),
        "all_claims": claims_list,
        "weekly_revenue_trend": [
            {"day": "Mon", "revenue": 120000},
            {"day": "Tue", "revenue": 125000},
            {"day": "Wed", "revenue": 123000},
            {"day": "Thu", "revenue": 130000},
            {"day": "Fri", "revenue": 145000},
            {"day": "Sat", "revenue": 150000},
            {"day": "Sun", "revenue": 160000},
        ],
        "risk_distribution": [
            {"name": "Low Risk", "value": 45},
            {"name": "Medium Risk", "value": 35},
            {"name": "High Risk", "value": 20},
        ]
    })

@app.route('/api/weather', methods=['GET'])
def proxy_weather():
    """Proxy endpoint for weather data to hide API key from frontend."""
    city = request.args.get('city', 'Unknown')
    api_key = os.getenv('OPENWEATHER_API_KEY')
    if not api_key:
        return jsonify({
            "coord": {"lon": 72.8777, "lat": 19.0760},
            "weather": [{"main": "Thunderstorm", "description": "heavy rain"}],
            "main": {"temp": 43.5, "humidity": 85},
            "wind": {"speed": 5.5},
            "rain": {"1h": 45},
            "name": city
        })
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
        res = requests.get(url)
        return jsonify(res.json()), res.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/air_pollution', methods=['GET'])
def proxy_air_pollution():
    """Proxy endpoint for air pollution to hide API key from frontend."""
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = os.getenv('OPENWEATHER_API_KEY')
    if not api_key:
        return jsonify({
            "list": [{"main": {"aqi": 5}}] # Maps to AQI > 300
        })
    try:
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
        res = requests.get(url)
        return jsonify(res.json()), res.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json

    email = data.get("email")
    password = data.get("password")
    city = data.get("city")

    # check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "User already exists"}), 400

    # create new user
    new_user = User(
        email=email,
        password=password,
        role="worker",
        plan="basic",
        city=city
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Signup successful"})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    # In a real application, you would hash the password and compare hashes.
    # Here we simulate the logic as outlined per requirements.
    user = User.query.filter_by(email=email).first()

    if user and user.password == password:
        return jsonify({
            "message": "Login successful",
            "role": user.role,
            "email": user.email
        }), 200
    
    # Also support hardcoded admin login
    if email == 'admin@gigshield.ai' and password == 'admin123':
        return jsonify({
            "message": "Login successful",
            "role": "admin",
            "email": email
        }), 200

    return jsonify({"message": "Invalid email or password"}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5000)
