from fastapi import FastAPI, HTTPException
import time
from Limiter.Algorithms.Fixed_window import FixedWindowLimiter
from Limiter.Algorithms.Sliding_window import SlidingWindowLimiter
from Limiter.limiter import Limiter
from database.mongodb import rules
from config.cache import get_cache, invalidate_cache
from Limiter.Algorithms.Token_bucket import TokenBucketLimiter

app = FastAPI()




@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.get("/fixed-window")
def fixed_window():

    user_id = "user_145"
    method = "GET"
    resource = "/login"

    rule = get_cache(
        "fixed_window",
        method,
        resource,
        rules
    )

    algorithm = FixedWindowLimiter(
        limit=rule["limit"],
        window_size=rule["window_size"]
    )

    limiter = Limiter(algorithm)

    return limiter.check(
        user_id,
        method,
        resource
    )

@app.get("/sliding-window")
def sliding_window():

    user_id = "app5"
    method = "GET"
    resource = "/login"

    rule = get_cache(
        "sliding_window",
        method,
        resource,
        rules
    )

    algorithm = SlidingWindowLimiter(
        limit=rule["limit"],
        window_size=rule["window_size"]
    )

    limiter = Limiter(algorithm)

    return limiter.check(
        user_id,
        method,
        resource
    )

@app.get("/token-bucket")
def token_bucket():

    user_id = "user_145"
    method = "GET"
    resource = "/login"

    rule = get_cache(
        "token_bucket",
        method,
        resource,
        rules
    )

    algorithm = TokenBucketLimiter(
        capacity=rule["capacity"],
        refill_rate=rule["refill_rate"]
    )

    limiter = Limiter(algorithm)

    return limiter.check(
        user_id,
        method,
        resource
    )