from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")

db = client["rate_limiter"]

rules = db["rate_limit_rules"]