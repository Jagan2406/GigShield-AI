import random

class AIRiskEngine:
    def __init__(self):
        # Base weekly premium
        self.base_premium = 50.0
        
    def calculate_weekly_premium(self, worker_id, location_data):
        """
        Calculate the weekly insurance premium based on environmental risk factors.
        Location data includes historical risk indices for rain, heat, pollution.
        """
        # Simulated risk calculation
        weather_risk_score = location_data.get('weather_risk', random.uniform(0.5, 1.5))
        social_risk_score = location_data.get('social_risk', random.uniform(0.8, 1.2))
        
        # Calculate premium between ₹50 and ₹150
        calculated_premium = self.base_premium * weather_risk_score * social_risk_score
        
        # Clamp premium to min 50, max 150
        final_premium = max(50.0, min(150.0, round(calculated_premium, 2)))
        
        return {
            "worker_id": worker_id,
            "weekly_premium_inr": final_premium,
            "risk_factors": {
                "weather": round(weather_risk_score, 2),
                "social": round(social_risk_score, 2)
            }
        }
        
risk_engine = AIRiskEngine()
