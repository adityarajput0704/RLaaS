from database.mongodb import rules

# rules.delete_many({})  # Clear existing rules

rules.insert_many([
    {
        "app_id": "xyz",
        "method": "POST",
        "resource": "/payments",
        "algorithm": "token_bucket",
        "config": {
            "capacity": 10,
            "refill_rate": 2
        }
    },
    {
    "app_id": "xyz",
    "method": "GET",
    "resource": "/search",
    "algorithm": "sliding_window",
    "config": {
        "limit": 3,
        "window_size": 30
    }
    },
    {
        "app_id": "xyz",
        "method": "GET",
        "resource": "/search",
        "algorithm": "fixed_window",
        "config": {
            "limit": 6,
            "window_size": 20
        }
    }
])


print("Rate limit rules seeded successfully.")