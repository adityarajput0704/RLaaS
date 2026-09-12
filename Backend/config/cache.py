from redis import Redis
from pymongo.collection import Collection
import json
from fastapi import HTTPException
from dotenv import load_dotenv
import os   
import time


load_dotenv()  # Load environment variables from .env file

redis_client = Redis(
    host=os.getenv("REDIS_HOST"),
    port=int(os.getenv("REDIS_PORT")),
    db=0,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5
)
cache_TTL = 3600 
local_cache = {}
LOCAL_CACHE_TTL = 2
 # Cache time-to-live in seconds (1 hour)
def get_cache(app_id: str, user_id: str, method: str, resource: str, rules_collection: Collection):
    method = method.upper()
    cache_key = f"config:{app_id}:{method}:{resource}"

    local_cached = local_cache.get(cache_key)

    if local_cached:
        rule, timestamp = local_cached

        if time.monotonic() - timestamp < LOCAL_CACHE_TTL:
            return rule

        del local_cache[cache_key]

    cached = redis_client.get(cache_key)

    if cached:
        rule = json.loads(cached)
        local_cache[cache_key] = (rule, time.monotonic())
        return rule 

    rule = rules_collection.find_one({"app_id": app_id, "method": method, "resource": resource})

    if not rule:
        raise HTTPException(status_code=404, detail=f"Rate limit rule not found for the specified {resource}.")


    rule.pop("_id", None)  # Remove the MongoDB ObjectId from the rule
    redis_client.setex(cache_key, cache_TTL, json.dumps(rule))
    local_cache[cache_key] = (rule, time.monotonic())

    return rule 

def invalidate_cache(
    app_id: str,
    method: str,
    resource: str,
):
    cache_key = f"config:{app_id}:{method}:{resource}"
    redis_client.delete(cache_key)
    local_cache.pop(cache_key, None)