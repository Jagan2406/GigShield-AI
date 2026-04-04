from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/ai/risk-score', methods=['POST'])
def risk_score():
    data = request.json
    # Logistic Regression mock logic
    return jsonify({"risk_score": 0.35, "risk_level": "Low"})

@app.route('/ai/fraud-score', methods=['POST'])
def fraud_score():
    data = request.json
    # Isolation Forest mock logic
    return jsonify({"fraud_score": 0.12, "fraud_result": "Safe"})

@app.route('/ai/premium', methods=['POST'])
def premium_calculation():
    data = request.json
    # Linear Regression mock logic
    return jsonify({"premium": 35.0, "payout": 1200.0})

@app.route('/ai/city-tier', methods=['POST'])
def city_tier():
    data = request.json
    # K-Means mock logic
    return jsonify({"city_tier": 2})

if __name__ == '__main__':
    app.run(port=5000)
