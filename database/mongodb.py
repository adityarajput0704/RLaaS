from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file
client = MongoClient(os.getenv("MONGO_URI"))

db = client["rate_limiter"]

rules = db["rate_limit_rules"]