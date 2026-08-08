# limiter.py

class Limiter:

    def __init__(self, algorithm):
        self.algorithm = algorithm

    def check(self, identifier, resource):
        return self.algorithm.is_request_allowed(
            identifier,
            resource
        )