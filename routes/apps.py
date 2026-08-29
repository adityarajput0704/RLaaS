from fastapi import APIRouter
from models.app import AppCreate
from database.mongo_apps import create_app
from auth.api_key import (
    generate_api_key, 
    generate_app_id, 
    hash_api_key
    )

router = APIRouter(prefix="/apps", tags=["Applications"] )

@router.post("/")
def register_app(app: AppCreate):

    app_id = generate_app_id()
    api_key = generate_api_key()
    api_key_hash= hash_api_key(api_key)

    app_data = {
        "app_id": app_id,
        "name" : app.name,
        "api_key_hash": api_key_hash
    }

    create_app(app_data)

    return{
        "app_id": app_id,
        "api_key": api_key  
    }