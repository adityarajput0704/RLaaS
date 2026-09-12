from fastapi import Header, HTTPException
from auth.api_key import authenticate_api_key, hash_api_key
from config.cache import redis_client



def check_management_limit(
    x_api_key: str | None = Header(default=None)
):
    # Authenticate the API key first
    app_id = authenticate_api_key(x_api_key)

    # Use hashed API key so raw credentials never appear in Redis
    key = f"management_limit:{hash_api_key(x_api_key)}"

    count = redis_client.incr(key)

    if count == 1:
        redis_client.expire(key, 60)

    if count > 10:
        raise HTTPException(
            status_code=429,
            detail="Management API rate limit exceeded",
            headers={
                "Retry-After": str(redis_client.ttl(key))
            }
        )

    return app_id