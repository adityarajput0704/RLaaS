from fastapi import FastAPI, HTTPException
import time
from Limiter.limiter import Limiter
from database.mongodb import rules
from config.cache import get_cache, invalidate_cache
from Limiter.factory import create_limiter
from Limiter.statistics import Statistics
app = FastAPI()




@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.get("/rate-limiter")
def rate_limiter(app_id: str, user_id: str, method: str, resource: str):
    method = method.upper()
    rule = get_cache(
        app_id,
        user_id,
        method,
        resource,
        rules
    )

    algortihm = create_limiter(rule["algorithm"], **rule["config"])

    limiter = Limiter(algortihm)

    return limiter.check(
        user_id,
        method,
        resource
    )

stats = Statistics()
@app.get("/stats/{user_id}")
def get_stats(user_id: str, method: str, resource: str):

    return stats.get_stats(user_id, method, resource)