from fastapi import FastAPI, HTTPException
import time
from Limiter.limiter import Limiter
from database.mongodb import rules
from config.cache import get_cache, invalidate_cache
from Limiter.factory import create_limiter
from Limiter.statistics import Statistics
from routes.rules import router as rules_router
from routes.apps import router as apps_router
from fastapi import Depends
from auth.api_key import get_authenticated_app

app = FastAPI()

app.include_router(rules_router)
app.include_router(apps_router)


@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.get("/rate-limiter")
def rate_limiter(
    user_id: str,
    method: str,
    resource: str,
    app_id: str = Depends(get_authenticated_app)
):
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


@app.get("/auth-test")
def auth_test(
    app_id: str = Depends(get_authenticated_app)
):
    return {
        "authenticated": True,
        "app_id": app_id
    }