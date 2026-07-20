from fastapi import FastAPI

app = FastAPI()

@app.get('/')
def home():
    return{"status": "System is Running Successfully"}


request_counts = {}
@app.get('/rate_limiter')
def rate_limiter():
    
    user_id = "user_145"  # Example user ID
    limit = 5  # Maximum number of requests allowed

    request_counts[user_id]= request_counts.get(user_id, 0)+1;

    if request_counts[user_id] > limit:
        return {"status": "Rate limit exceeded. Please try again later."}
    
    return {"status": "Request successful."}