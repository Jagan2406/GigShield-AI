import random
import time

class PayoutSimulator:
    def __init__(self):
        self.payout_history = []
        
    def simulate_payout(self, worker_id, amount_inr, event_type):
        """
        Simulate an instant payout using Razorpay Test Mode logic.
        """
        # Simulate processing delay
        # time.sleep(1) # Commented out for faster API response
        
        transaction_id = f"pay_{random.randint(1000000, 9999999)}"
        
        payout_record = {
            "transaction_id": transaction_id,
            "worker_id": worker_id,
            "amount": amount_inr,
            "event": event_type,
            "status": "SUCCESS",
            "timestamp": time.time()
        }
        
        self.payout_history.append(payout_record)
        return payout_record

payout_simulator = PayoutSimulator()
