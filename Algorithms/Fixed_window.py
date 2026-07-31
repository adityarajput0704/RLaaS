import time
from fastapi import FastAPI
from redis import Redis


class FixedWindowLimiter:
    def __init__(self, limit:int, window_size:int):
        self.limit = limit
        self.window_size = window_size
        self.redis = Redis(host='localhost', port=6379, decode_responses=True)
        

    def is_request_allowed (self, user_id:str):
        try:
            self.redis = Redis(host='localhost', port=6379, decode_responses=True)
            self.redis.ping()
        except Exception as e:
            print(f"Error connecting to Redis: {e}")

        if not self.redis.exists(user_id):
            self.redis.set(user_id, 1, ex=self.window_size)
            return {"status": "Request successful."}

        count = int(self.redis.get(user_id))
    
        if(count >= self.limit):
            return {
                "status": "Rate limit exceeded.",
                "retry_after": self.redis.ttl(user_id)
            }

        self.redis.incr(user_id)

        return {"status": "Request successful."}