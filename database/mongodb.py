from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file
client = MongoClient(
    os.getenv("MONGO_URI"),
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=5000
)

db = client["rate_limiter"]

rules = db["rate_limit_rules"]
apps = db["applications"]

rules.create_index(
    [
        ("app_id", 1),
        ("method", 1),
        ("resource", 1)
    ],
    unique=True
)

apps.create_index(
    "app_id",
    unique=True
)

apps.create_index(
    "api_key_hash",
    unique=True
)