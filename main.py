from fastapi import FastAPI
import time
from Algorithms.Fixed_window import FixedWindowLimiter
from limiter import Limiter


app = FastAPI()


algorithm = FixedWindowLimiter(limit=5, window_size=60)

limiter = Limiter(algorithm)

@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.get('/rate_limiter')
def rate_limiter():
    
    user_id = "user_145"  # Example user ID
    return limiter.check(user_id, "/login")

