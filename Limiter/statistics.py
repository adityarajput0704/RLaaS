from redis import Redis
from dotenv import load_dotenv

load_dotenv()
import os


class Statistics:

    def __init__(self):
        self.redis = Redis(
            host=os.getenv("REDIS_HOST"),
            port=os.getenv("REDIS_PORT"),
            db=0,
            decode_responses=True
        )

    def record_allowed(self, user_id, method, resource):
        method = method.upper()
        app_id = "xyz"
        key = f"stats:{app_id}:{user_id}:{method}:{resource}:allowed"

        self.redis.incr(key)

    def record_blocked(self, user_id, method, resource):
        method = method.upper()
        app_id = "xyz"
        key = f"stats:{app_id}:{user_id}:{method}:{resource}:blocked"

        self.redis.incr(key)

    def get_stats(self, user_id, method, resource):
        method = method.upper()
        app_id ="xyz"
        allowed_key = (
            f"stats:{app_id}:{user_id}:{method}:{resource}:allowed"
        )

        blocked_key = (
            f"stats:{app_id}:{user_id}:{method}:{resource}:blocked"
        )

        allowed = self.redis.get(allowed_key)
        blocked = self.redis.get(blocked_key)

        return {
            "user_id": user_id,
            "method": method,
            "resource": resource,
            "allowed": int(allowed or 0),
            "blocked": int(blocked or 0)
        }