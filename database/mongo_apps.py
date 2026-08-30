from database.mongodb import apps


def create_app(app_data):
    apps.insert_one(app_data)
    return app_data["app_id"]


def get_app(app_id):
    return apps.find_one({
        "app_id": app_id
    })

def revoke_api_key(app_id):

    return apps.update_one(
        {"app_id": app_id},
        {
            "$set": {
                "api_key_revoked": True
            }
        }
    )

def rotate_api_key(app_id, new_api_key_hash, expires_at):

    return apps.update_one(
        {"app_id": app_id},
        {
            "$set": {
                "api_key_hash": new_api_key_hash,
                "api_key_revoked": False,
                "api_key_expires_at": expires_at
            }
        }
    )