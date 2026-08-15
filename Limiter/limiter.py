# limiter.py
from Limiter.statistics import Statistics
from fastapi import HTTPException
class Limiter:

    def __init__(self, algorithm):
        self.algorithm = algorithm
        self.stats = Statistics()

    def check(self, identifier, method, resource):

        try:
            result = self.algorithm.is_request_allowed(
                identifier,
                method,
                resource
            )
            self.stats.record_allowed(
                identifier, 
                method, 
                resource
            )

            return result
        
        except HTTPException:
            self.stats.record_blocked(
                identifier,
                method,
                resource
            )
            raise