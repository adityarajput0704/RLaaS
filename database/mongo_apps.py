from database.mongodb import apps


def create_app(app_data):
    apps.insert_one(app_data)
    return app_data["app_id"]


def get_app(app_id):
    return apps.find_one({
        "app_id": app_id
    })