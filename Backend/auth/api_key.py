from fastapi import HTTPException, Header   
from Backend.database.mongodb import apps 
import secrets
import hashlib
from datetime import datetime, timezone

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
            status_code=401,
            detail="Invalid Api key"
        )

    if app.get("api_key_revoked", False):
        raise HTTPException(
            status_code=401,
            detail="API key has been revoked"
        )

    expires_at = app.get("api_key_expires_at")

    if expires_at:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=401,
                detail="API key has expired"
            )

    return app["app_id"]


def get_authenticated_app(
    x_api_key: str | None = Header(default=None)
):
    return authenticate_api_key(x_api_key)

def authenticate_api_key_for_rotation(api_key: str):
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required"
        )

    api_key_hash = hash_api_key(api_key)

    app = apps.find_one({
        "api_key_hash": api_key_hash
    })

    if not app:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    if app.get("api_key_revoked", False):
        raise HTTPException(
            status_code=401,
            detail="API key has been revoked"
        )

    # IMPORTANT:
    # We intentionally do NOT check expiration here.
    return app["app_id"]


def get_authenticated_app_for_rotation(
    x_api_key: str | None = Header(default=None)
):
    return authenticate_api_key_for_rotation(x_api_key)