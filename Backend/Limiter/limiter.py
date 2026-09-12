from fastapi import HTTPException


class Limiter:

    def __init__(self, algorithm):
        self.algorithm = algorithm

    def check(self, app_id, user_id, method, resource):

        identifier = f"{app_id}:{user_id}"

        try:
            return self.algorithm.is_request_allowed(
                identifier,
                method,
                resource
            )

        except HTTPException:
            raise