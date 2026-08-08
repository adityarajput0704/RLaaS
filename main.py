from fastapi import FastAPI, HTTPException
import time
from Limiter.Algorithms.Fixed_window import FixedWindowLimiter
from Limiter.limiter import Limiter
from database.mongodb import rules


app = FastAPI()


# algorithm = FixedWindowLimiter(limit=5, window_size=60)

# limiter = Limiter(algorithm)

@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.get('/rate_limiter')
def rate_limiter():
    
    user_id = "user_145"  # Example user ID
    resource = "/login"  # Example resource being accessed

    rule = rules.find_one({"resource": resource})
    if(not rule):
        raise HTTPException(status_code = 404, detail="Rate limit rule not found for the resource.")

    algorithm = FixedWindowLimiter(limit=rule["limit"], window_size=rule["window_size"])

    limiter = Limiter(algorithm)


    return limiter.check(user_id, "/login")

