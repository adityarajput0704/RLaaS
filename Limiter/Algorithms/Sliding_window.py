from fastapi import HTTPException
import time 
from redis import Redis
import uuid 
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file


class SlidingWindowLimiter:
    def __init__(self, limit:int, window_size:int):
        self.limit = limit
        self.window_size = window_size
        self.redis = Redis(host=os.getenv("REDIS_HOST"), port=int(os.getenv("REDIS_PORT")), decode_responses=True)

    def is_request_allowed(self, identifier, method, resource):
        key = f"{identifier}:{method}:{resource}"
        request_id = str(uuid.uuid4())

        current_time = time.time()

        cutoff = current_time - self.window_size

        # Remove timestamps that are outside the current window
        self.redis.zremrangebyscore(key, 0, cutoff)

        count = self.redis.zcard(key)

        if count >= self.limit:
            raise HTTPException(status_code=429, 
                                detail="Rate limit exceeded",
                                 headers={
                                     "Retry-After": str(self.window_size - (current_time - cutoff))
                         })

        self.redis.zadd(key, {request_id: current_time})

        self.redis.expire(key, self.window_size)

        return {"allowed": "Request allowed."}
