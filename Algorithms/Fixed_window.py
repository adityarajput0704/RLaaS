from redis import Redis


class FixedWindowLimiter:
    def __init__(self, limit:int, window_size:int):
        self.limit = limit
        self.window_size = window_size
        self.redis = Redis(host='localhost', port=6379, decode_responses=True)

    def check (self, identifier, resource):
        key = f"{identifier}:{resource}"
        if not self.redis.exists(key):
            self.redis.set(key, 1, ex=self.window_size)
            return {"allowed": "Request allowed."}
       
        count = int(self.redis.get(key))
           
        if(count >= self.limit):
            return {
                "allowed": "False",
                "retry_after": self.redis.ttl(key)
            }
       
        self.redis.incr(key)
       
        return {"allowed": "Request allowed."}

    