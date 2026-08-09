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
    }
])

# rules.update_one(
#     {"resource": "/payments"},
#     {"$set": {"limit": 3 }})

print("Rate limit rules seeded successfully.")