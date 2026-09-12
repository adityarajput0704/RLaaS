from fastapi import HTTPException
import time 
from config.cache import redis_client
import uuid 

sliding_window_script = redis_client.register_script("""
    local cutoff = tonumber(ARGV[1])
    local current_time = tonumber(ARGV[2])
    local window_size = tonumber(ARGV[3])
    local limit = tonumber(ARGV[4])
    local request_id = ARGV[5]

    redis.call("ZREMRANGEBYSCORE", KEYS[1], 0, cutoff)

    local count = redis.call("ZCARD", KEYS[1])

    if count >= limit then
        redis.call("INCR", ARGV[6])
        return 0
    end

    redis.call("ZADD", KEYS[1], current_time, request_id)
    redis.call("EXPIRE", KEYS[1], window_size)

    redis.call("INCR", ARGV[7])

    return 1

""")


class SlidingWindowLimiter:
    def __init__(self, limit:int, window_size:int):
        self.limit = limit
        self.window_size = window_size
        self.redis = redis_client
    def is_request_allowed(self, identifier, method, resource):
        key = f"{identifier}:{method}:{resource}"
        request_id = str(uuid.uuid4())

        current_time = time.time()

        cutoff = current_time - self.window_size

        # Remove timestamps that are outside the current window
        allowed_key = f"stats:{identifier}:{method}:{resource}:allowed"
        blocked_key = f"stats:{identifier}:{method}:{resource}:blocked"

        allowed = sliding_window_script(
            keys=[key],
            args=[
            cutoff,
            current_time,
            self.window_size,
            self.limit,
            request_id,
            allowed_key,
            blocked_key
        ]
    )

        if not allowed:
            raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={
                "Retry-After": str(self.window_size)
            }
        )

        return {"allowed": "Request allowed."}
