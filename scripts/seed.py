from database.mongodb import rules

# rules.delete_many({})  # Clear existing rules
rules.insert_many([
    {  
        "method": "GET",
        "resource": "/login",
        "algorithm": "fixed_window",
        "limit": 5,
        "window_size": 60
    },
    {
        "method": "POST",
        "resource": "/payments",
        "algorithm": "fixed_window",
        "limit": 10,
        "window_size": 60
    },
    {
        "app_id": "app_001",
        "method": "GET",
        "resource": "/login",
        "algorithm": "token_bucket",
        "capacity": 5,
        "refill_rate": 1
    },
    {
        "app_id": "app_001",
        "method": "POST",
        "resource": "/payments",
        "algorithm": "token_bucket",
        "capacity": 10,
        "refill_rate": 2
    },
    {
        "app_id": "app_002",
        "method": "GET",
        "resource": "/login",
        "algorithm": "token_bucket",
        "capacity": 20,
        "refill_rate": 5
    },
     {   
    "method": "GET",
    "resource": "/login",
    "algorithm": "sliding_window",
    "limit": 5,
    "window_size": 60
    }

])

# rules.insert_many([
#     {
#         "app_id": "app_001",
#         "method": "GET",
#         "resource": "/login", 
#         "algorithm": "token_bucket",
#         "capacity": 5,
#         "refill_rate": 1
#     },
#     {
#         "app_id": "app_001",
#         "method": "POST",
#         "resource": "/payments",
#         "algorithm": "token_bucket",
#         "capacity": 10,
#         "refill_rate": 2
#     },
#     {
#         "app_id": "app_002",
#         "method": "GET",
#         "resource": "/login",
#         "algorithm": "token_bucket",
#         "capacity": 20,
#         "refill_rate": 5
#     }
# ])

# rules.insert_one([
#     {
#     "method": "GET",
#     "resource": "/login",
#     "algorithm": "sliding_window",
#     "limit": 5,
#     "window_size": 60
#     }
# ])

# rules.update_one(
#     {"resource": "/payments"},
#     {"$set": {"limit": 3 }})

print("Rate limit rules seeded successfully.")