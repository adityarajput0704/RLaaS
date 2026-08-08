from redis import Redis
from fastapi import HTTPException


class FixedWindowLimiter:
    def __init__(self, limit:int, window_size:int):
        self.limit = limit
        self.window_size = window_size
        self.redis = Redis(host='localhost', port=6379, decode_responses=True)

    def is_request_allowed (self, identifier, resource):
        key = f"{identifier}:{resource}"

        count = self.redis.incr(key)
        if(count == 1):
            self.redis.expire(key, self.window_size)

        if(count > self.limit):
            raise HTTPException(status_code=429, 
                                detail="Rate limit exceeded",
                                 headers={
                                     "Retry-After": str(self.redis.ttl(key))
                         })
    
       
        return {"allowed": "Request allowed."}

    