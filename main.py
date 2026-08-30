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
from models.rate_limit import RateLimitRequest

app = FastAPI()

app.include_router(rules_router)
app.include_router(apps_router)


@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


@app.post("/rate-limiter")
def rate_limiter(
    request: RateLimitRequest,
    app_id: str = Depends(get_authenticated_app)
):
    method = request.method.upper()

    rule = get_cache(
        app_id,
        request.user_id,
        method,
        request.resource,
        rules
    )

    algorithm = create_limiter(
        rule["algorithm"],
        **rule["config"]
    )

    limiter = Limiter(algorithm)

    return limiter.check(
        app_id,
        request.user_id,
        method,
        request.resource
    )

stats = Statistics()
@app.get("/stats/{user_id}")
def get_stats(
    user_id: str,
    method: str,
    resource: str,
    app_id: str = Depends(get_authenticated_app)
):

    return stats.get_stats(app_id, user_id, method, resource)


@app.get("/auth-test")
def auth_test(
    app_id: str = Depends(get_authenticated_app)
):
    return {
        "authenticated": True,
        "app_id": app_id
    }