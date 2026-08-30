from Backend.Limiter.statistics import Statistics
from fastapi import HTTPException


class Limiter:

    def __init__(self, algorithm):
        self.algorithm = algorithm
        self.stats = Statistics()

    def check(self, app_id, user_id, method, resource):

        identifier = f"{app_id}:{user_id}"

        try:
            result = self.algorithm.is_request_allowed(
                identifier,
                method,
                resource
            )

            self.stats.record_allowed(
                app_id,
                user_id,
                method,
                resource
            )

            return result

        except HTTPException:
            self.stats.record_blocked(
                app_id,
                user_id,
                method,
                resource
            )
            raise