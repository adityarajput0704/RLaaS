from redis import Redis
from pymongo.collection import Collection
import json
from fastapi import HTTPException
from dotenv import load_dotenv
import os   

load_dotenv()  # Load environment variables from .env file

redis_client = Redis(host=os.getenv("REDIS_HOST"), port=int(os.getenv("REDIS_PORT")), db=0)

cache_TTL = 3600  # Cache time-to-live in seconds (1 hour)
def get_cache(app_id: str, user_id: str, method: str, resource: str, rules_collection: Collection):
    cache_key = f"config:{app_id}:{method}:{resource}"

    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    rule = rules_collection.find_one({"app_id": app_id, "method": method, "resource": resource})
    print(f"Fetched rule from MongoDB: {rule}")  # Debugging line
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rate limit rule not found for the specified {resource}.")


    rule.pop("_id", None)  # Remove the MongoDB ObjectId from the rule
    redis_client.setex(cache_key, cache_TTL, json.dumps(rule))
    return rule

def invalidate_cache(
    app_id: str,
    method: str,
    resource: str,
):
    cache_key = f"config:{app_id}:{method}:{resource}"
    redis_client.delete(cache_key)