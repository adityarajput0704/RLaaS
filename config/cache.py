from redis import Redis
from pymongo.collection import Collection
import json
from fastapi import HTTPException

redis_client = Redis(host='localhost', port=6379, db=0)

cache_TTL = 3600  # Cache time-to-live in seconds (1 hour)
def get_cache(method: str, resource: str, rules_collection: Collection):
    cache_key = f"config:{method}:{resource}"

    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    rule = rules_collection.find_one({"method": method, "resource": resource})
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rate limit rule not found for the specified {resource}.")


    rule.pop("_id", None)  # Remove the MongoDB ObjectId from the rule
    redis_client.setex(cache_key, cache_TTL, json.dumps(rule))
    return rule

def invalidate_cache(resource: str):
    cache_key = f"config:{resource}"
    redis_client.delete(cache_key)