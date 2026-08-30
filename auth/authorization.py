from fastapi import HTTPException


def verify_app_access(resource, app_id):
    if resource["app_id"] != app_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this resource"
        )