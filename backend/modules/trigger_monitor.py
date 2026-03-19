import random

class TriggerMonitor:
    def __init__(self):
        self.active_events = []
        
    def check_triggers(self, location_id):
        """
        Monitors parametric triggers for sudden events (rain, heat, pollution).
        In a real app, this would connect to a weather API (e.g., OpenWeather)
        or a government API for curfews.
        """
        # Simulating external API calls
        events = []
        
        # 10% chance of a severe event for simulation
        if random.random() < 0.1:
            events.append({"type": "Heavy Rain", "severity": "High", "payout_multiplier": 1.5})
            
        if random.random() < 0.05:
            events.append({"type": "Extreme Heat", "severity": "Critical", "payout_multiplier": 1.2})
            
        if random.random() < 0.02:
            events.append({"type": "Severe Pollution (AQI > 400)", "severity": "High", "payout_multiplier": 1.0})
            
        if random.random() < 0.01:
            events.append({"type": "Sudden Curfew", "severity": "Critical", "payout_multiplier": 2.0})
            
        self.active_events = events
        return events

trigger_monitor = TriggerMonitor()
