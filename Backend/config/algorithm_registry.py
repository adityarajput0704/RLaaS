ALGORITHMS = {
    "token_bucket": {
        "required": ["capacity", "refill_rate"],
        "allowed": ["capacity", "refill_rate"]
    },
    "fixed_window": {
        "required": ["limit", "window_size"],
        "allowed": ["limit", "window_size"]
    },
    "sliding_window": {
        "required": ["limit", "window_size"],
        "allowed": ["limit", "window_size"]
    }
}