from fastapi import FastAPI, HTTPException
from Backend.Limiter.Algorithms.Fixed_window import FixedWindowLimiter
from Backend.Limiter.Algorithms.Sliding_window import SlidingWindowLimiter
from Backend.Limiter.Algorithms.Token_bucket import TokenBucketLimiter

algorithm_map = {
    "fixed_window": FixedWindowLimiter,
    "sliding_window": SlidingWindowLimiter,
    "token_bucket": TokenBucketLimiter
}

def create_limiter(algorithm_name: str, **kwargs):

    algorithm_class = algorithm_map.get(algorithm_name)

    if not algorithm_class:
        raise HTTPException(status_code=400, detail=f"Algorithm '{algorithm_name}' is not supported.")

    return algorithm_class(**kwargs)