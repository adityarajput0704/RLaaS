from Backend.Limiter.Algorithms.Fixed_window import FixedWindowLimiter

limiter = FixedWindowLimiter(
    limit=3,
    window_size=60
)

for i in range(5):
    print(f" 60: {limiter.check("60", "/profile")}")
    print(f" 42: {limiter.check("42", "/profile")}")