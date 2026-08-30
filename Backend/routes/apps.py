from fastapi import APIRouter, HTTPException, Depends
from Backend.models.app import AppCreate
from Backend.database.mongo_apps import create_app, revoke_api_key, rotate_api_key, get_app
from Backend.auth.api_key import (
    generate_api_key, 
    generate_app_id, 
    hash_api_key,
     get_authenticated_app_for_rotation
    )
from datetime import datetime, timedelta, timezone
from Backend.auth.api_key import get_authenticated_app
from Backend.auth.management_limit import check_management_limit



router = APIRouter(prefix="/apps", tags=["Applications"] )

@router.post("/", )
def register_app(app: AppCreate):

    app_id = generate_app_id()
    api_key = generate_api_key()
    api_key_hash = hash_api_key(api_key)

    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    app_data = {
        "app_id": app_id,
        "name": app.name,
        "api_key_hash": api_key_hash,
        "api_key_revoked": False,
        "api_key_expires_at": expires_at
    }

    create_app(app_data)

    return {
        "app_id": app_id,
        "api_key": api_key,
        "expires_at": expires_at
    }

@router.post("/revoke-key", dependencies=[Depends(check_management_limit)])
def revoke_key(app_id: str = Depends(get_authenticated_app)):

    result = revoke_api_key(app_id)

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return {
        "message": "API key revoked successfully"
    }

@router.post("/rotate-key")
def rotate_key(app_id: str= Depends(get_authenticated_app_for_rotation)):

    app = get_app(app_id)

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    new_api_key = generate_api_key()
    new_api_key_hash = hash_api_key(new_api_key)

    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    result = rotate_api_key(
        app_id,
        new_api_key_hash,
        expires_at
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=500,
            detail="Failed to rotate API key"
        )

    return {
        "message": "API key rotated successfully",
        "app_id": app_id,
        "api_key": new_api_key,
        "expires_at": expires_at
    }