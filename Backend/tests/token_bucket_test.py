from Backend.Limiter.Algorithms.Token_bucket import TokenBucketLimiter
from fastapi import HTTPException

limiter = TokenBucketLimiter(
    capacity=5,
    refill_rate=1
)


for i in range(10):
    try:
        result = limiter.is_request_allowed(
            "burst_user",
            "GET",
            "/payments"
        )

        print(f"Request {i + 1}: ALLOWED")

    except HTTPException as e:
        print(f"Request {i + 1}: BLOCKED - {e.detail}")

import time

time.sleep(2)

for i in range(3):
    try:
        result = limiter.is_request_allowed(
            "burst_user",
            "GET",
            "/payments"
        )
        print(f"After refill {i + 1}: ALLOWED")

    except HTTPException as e:
        print(f"After refill {i + 1}: BLOCKED - {e.detail}")