# limiter.py

class Limiter:

    def __init__(self, algorithm):
        self.algorithm = algorithm

    def check(self, identifier, method, resource):
        return self.algorithm.is_request_allowed(
            identifier,
            method,
            resource
        )