from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from Backend.Limiter.limiter import Limiter
from Backend.database.mongodb import rules
from Backend.config.cache import get_cache, invalidate_cache
from Backend.Limiter.factory import create_limiter
from Backend.Limiter.statistics import Statistics
from Backend.routes.rules import router as rules_router
from Backend.routes.apps import router as apps_router
from fastapi import Depends
from Backend.auth.api_key import get_authenticated_app
from Backend.models.rate_limit import RateLimitRequest
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(rules_router)
app.include_router(apps_router)

@app.middleware("http")
async def add_security_headers(request, call_next):

    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"

    return response

@app.middleware("http")
async def limit_request_size(request: Request, call_next):

    max_size = 1024 * 10  # 10 KB

    content_length = request.headers.get("content-length")

    if content_length and int(content_length) > max_size:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large"}
        )

    return await call_next(request)

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error"
        }
    )

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