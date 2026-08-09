from fastapi import FastAPI, HTTPException
import time
from Limiter.Algorithms.Fixed_window import FixedWindowLimiter
from Limiter.limiter import Limiter
from database.mongodb import rules
from config.cache import get_cache, invalidate_cache


app = FastAPI()




@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.get('/rate_limiter')
def rate_limiter():
    
    user_id = "user_145"
    method = "GET"
    resource = "/login"

    rule = get_cache(method, resource, rules)

    algorithm = FixedWindowLimiter(limit=rule["limit"], window_size=rule["window_size"])

    limiter = Limiter(algorithm)


    return limiter.check(user_id, method,resource)

