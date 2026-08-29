from fastapi import HTTPException, Header   
from database.mongodb import apps 
import secrets
import hashlib


def generate_app_id():
    return f"app_{secrets.token_hex(8)}"

def generate_api_key():
    return f"rlaas_{secrets.token_urlsafe(32)}"

def hash_api_key(api_key: str):
    return hashlib.sha256(api_key.encode()).hexdigest()

def authenticate_api_key(api_key: str):
    if not api_key:
        raise HTTPException(status_code=401, detail="Api key required")

    api_key_hash= hash_api_key(api_key)

    app = apps.find_one({
        "api_key_hash": api_key_hash
    })

    if not app:
        raise HTTPException(
            status_code=402,
            detail="Invalid Api key"
        )

    return app["app_id"]


def get_authenticated_app(
    x_api_key: str | None = Header(default=None)
):
    return authenticate_api_key(x_api_key)