from config.cache import redis_client
from fastapi import HTTPException   


fixed_window_script = redis_client.register_script("""
        local count = redis.call("INCR", KEYS[1])

        if count == 1 then
            redis.call("EXPIRE", KEYS[1], ARGV[1])
        end

        if count > tonumber(ARGV[2]) then
            redis.call("INCR", ARGV[4])
            return {0, redis.call("TTL", KEYS[1])}
        end

        redis.call("INCR", ARGV[3])
        return {1, 0}
""")

class FixedWindowLimiter:
    def __init__(self, limit:int, window_size:int):
        self.limit = limit
        self.window_size = window_size
        self.redis = redis_client

    def is_request_allowed (self, identifier, method, resource):
        key = f"{identifier}:{method}:{resource}"

        allowed_key = f"stats:{identifier}:{method}:{resource}:allowed"
        blocked_key = f"stats:{identifier}:{method}:{resource}:blocked"

        result = fixed_window_script(
            keys=[key],
            args=[
                self.window_size,
                self.limit,
                allowed_key,
                blocked_key
            ]
        )

        if result[0] == 0:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
                headers={"Retry-After": str(result[1])}
            )

        return {"allowed": "Request allowed."}
    
       

    