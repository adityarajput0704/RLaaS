from Limiter.Algorithms.Sliding_window import SlidingWindowLimiter
from fastapi import HTTPException

limiter = SlidingWindowLimiter(
    limit=5,
    window_size=60
)
for i in range(7):
    try:
        result = limiter.is_request_allowed(
            "user_145",
            "GET",
            "/login"
        )

        print(f"Request {i + 1}: {result}")

    except HTTPException as e:
        print(f"Request {i + 1}: BLOCKED - {e.detail}")
