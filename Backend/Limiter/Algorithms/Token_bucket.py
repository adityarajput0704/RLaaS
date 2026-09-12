from fastapi import HTTPException
import time 
import uuid
from config.cache import redis_client
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

token_bucket_script= redis_client.register_script("""
            local tokens = tonumber(
                redis.call("HGET", KEYS[1], "tokens")
            )

            local last_refill = tonumber(
                redis.call("HGET", KEYS[1], "last_refill")
            )

            local capacity = tonumber(ARGV[1])
            local refill_rate = tonumber(ARGV[2])
            local current_time = tonumber(ARGV[3])

            -- First request
            if not tokens then
                tokens = capacity
                last_refill = current_time
            end

            -- Calculate refill
            local elapsed = current_time - last_refill

            tokens = math.min(
                capacity,
                tokens + elapsed * refill_rate
            )

            -- Check whether a token is available
            if tokens < 1 then

            redis.call(
                "HSET",
                KEYS[1],
                "tokens",
                tokens,
                "last_refill",
                current_time
            )

            redis.call("INCR", ARGV[5])

            return 0
            end

            -- Consume one token
            tokens = tokens - 1

            -- Save bucket state
            redis.call(
                "HSET",
                KEYS[1],
                "tokens",
                tokens,
                "last_refill",
                current_time
            )

            redis.call(
                "EXPIRE",
                KEYS[1],
                3600
            )
            redis.call("INCR", ARGV[4])


            return 1
        """)
class TokenBucketLimiter:
    def __init__(self, capacity: int, refill_rate: float, ):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.redis = redis_client
        

    def is_request_allowed(self, identifier, method, resource):
        key = f"bucket:{identifier}:{method}:{resource}"

        allowed_key = f"stats:{identifier}:{method}:{resource}:allowed"
        blocked_key = f"stats:{identifier}:{method}:{resource}:blocked"

        result = token_bucket_script(
            keys=[key],
            args=[
                self.capacity,
                self.refill_rate,
                time.time(),
                allowed_key,
                blocked_key
            ]
        )

        if result < 1:
            raise HTTPException(
                status_code=429,
                detail="Tokens will be refilled after some time. Please try again later."
            )

        return {
            "allowed by token bucket": True,
        }

        