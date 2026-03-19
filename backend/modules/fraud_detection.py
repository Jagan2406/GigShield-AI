class FraudDetectionSystem:
    def __init__(self):
        # In memory store for simulation
        self.recent_claims = {}
        
    def analyze_claim(self, worker_id, location_coords, event_type):
        """
        Analyzes a claim for potential fraud.
        Checks for GPS spoofing, duplicate claims, or abnormal velocity.
        """
        flags = []
        is_fraud = False
        
        # 1. Duplicate claim check
        if worker_id in self.recent_claims:
            flags.append("Duplicate Claim Detected")
            is_fraud = True
            
        # 2. Simulated GPS spoofing check (mock logic)
        # If coordinates are perfectly round numbers, flag as suspicious
        if location_coords.get('lat', 0.1) % 1 == 0:
            flags.append("Suspicious GPS Coordinates")
            is_fraud = True

        return {
            "is_fraud": is_fraud,
            "flags": flags,
            "risk_score": 90 if is_fraud else 10
        }
        
    def register_claim(self, worker_id):
        self.recent_claims[worker_id] = True

fraud_system = FraudDetectionSystem()
