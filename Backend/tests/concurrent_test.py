import requests
from concurrent.futures import ThreadPoolExecutor


URL = "http://127.0.0.1:8000/rate-limiter"

params = {
    "app_id": "xyz",
    "user_id": "concurrent_user",
    "method": "POST",
    "resource": "/payments"
}


def send_request():
    response = requests.get(URL, params=params)
    return response.status_code


with ThreadPoolExecutor(max_workers=20) as executor:
    results = list(
        executor.map(
            lambda _: send_request(),
            range(20)
        )
    )


print("Allowed:", results.count(200))
print("Blocked:", results.count(429))
print("Other:", len(results) - results.count(200) - results.count(429))