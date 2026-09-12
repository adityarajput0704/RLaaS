from locust import HttpUser, task, between

API_KEY = "rlaas_kyX1mrzmJXi30c3F4ehRf649lHEKhG1nFS5db03Nmqo"


class RateLimiterUser(HttpUser):
    wait_time = between(0, 0)

    @task
    def test_rate_limiter(self):
        self.client.post(
            "/rate-limiter",
            headers={
                "X-API-Key": API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "user_id": "benchmark_user",
                "method": "GET",
                "resource": "/test",
            },
        )