from redis import Redis
from fastapi import HTTPException   
from dotenv import load_dotenv
import os

load_dotenv()


class FixedWindowLimiter:
    def __init__(self, limit:int, window_size:int):
        self.limit = limit
        self.window_size = window_size
        self.redis = Redis(host=os.getenv("REDIS_HOST"),
                        port=int(os.getenv("REDIS_PORT")),
                        db=0,
                        decode_responses=True,
                        socket_connect_timeout=5,
                        socket_timeout=5
                        )

    def is_request_allowed (self, identifier, method, resource):
        key = f"{identifier}:{method}:{resource}"

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

    