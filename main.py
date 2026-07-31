from fastapi import FastAPI
import time
from Algorithms.Fixed_window import FixedWindowLimiter

app = FastAPI()




limiter = FixedWindowLimiter(limit=5, window_size=60)

@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.get('/rate_limiter')
def rate_limiter():
    
    user_id = "user_145"  # Example user ID
    return limiter.is_request_allowed(user_id)

