from fastapi import FastAPI
import time

app = FastAPI()



class FixedWindowLimiter:
    def __init__(self, limit:int, window_size:int):
        self.limit = limit
        self.window_size = window_size
        self.request_counts = {}
        self.window_start_time = {}

    def is_request_allowed (self, user_id:str):
        current_time = time.time()
        if user_id not in self.request_counts:
            self.request_counts[user_id] = 1
            self.window_start_time[user_id] = current_time
            return {"status": "Request successful."}
        
        if(current_time - self.window_start_time[user_id] > self.window_size):
            self.request_counts[user_id] = 1
            self.window_start_time[user_id] = current_time
            return {"status": "Request successful."}

        if(self.request_counts[user_id] > self.limit):
            return {"status": "Rate limit exceeded. Please try again later."}

        self.request_counts[user_id] += 1
        print(f"Current: {current_time}")
        print(f"Start: {self.window_start_time.get(user_id)}")
        print(f"Elapsed: {current_time - self.window_start_time.get(user_id, current_time)}")
        print(f"Count: {self.request_counts.get(user_id)}")
        return {"status": "Request successful."}


limiter = FixedWindowLimiter(limit=5, window_size=60)

@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.get('/rate_limiter')
def rate_limiter():
    
    user_id = "user_145"  # Example user ID
    return limiter.is_request_allowed(user_id)

