from Limiter.Algorithms.Token_bucket import TokenBucketLimiter
from fastapi import HTTPException

limiter = TokenBucketLimiter(
    capacity=5,
    refill_rate=1
)

for i in range(7):
    try:
        result = limiter.is_request_allowed(
            "user_145",
            "GET",
            "/payments"
        )

        print(f"Request {i + 1}: {result}")

    except HTTPException as e:
        print(f"Request {i + 1}: BLOCKED - {e.detail}")