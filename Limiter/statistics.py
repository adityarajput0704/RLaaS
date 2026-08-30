from redis import Redis
from dotenv import load_dotenv
import os

load_dotenv()


class Statistics:

    def __init__(self):
        self.redis = Redis(host=os.getenv("REDIS_HOST"),
                                port=int(os.getenv("REDIS_PORT")),
                                db=0,
                                decode_responses=True,
                                socket_connect_timeout=5,
                                socket_timeout=5
                                )

    def record_allowed(self, app_id, user_id, method, resource):
        method = method.upper()

        key = f"stats:{app_id}:{user_id}:{method}:{resource}:allowed"

        self.redis.incr(key)

    def record_blocked(self, app_id, user_id, method, resource):
        method = method.upper()

        key = f"stats:{app_id}:{user_id}:{method}:{resource}:blocked"

        self.redis.incr(key)

    def get_stats(self, app_id, user_id, method, resource):
        method = method.upper()

        allowed_key = (
            f"stats:{app_id}:{user_id}:{method}:{resource}:allowed"
        )

        blocked_key = (
            f"stats:{app_id}:{user_id}:{method}:{resource}:blocked"
        )

        allowed = self.redis.get(allowed_key)
        blocked = self.redis.get(blocked_key)

        return {
            "app_id": app_id,
            "user_id": user_id,
            "method": method,
            "resource": resource,
            "allowed": int(allowed or 0),
            "blocked": int(blocked or 0)
        }