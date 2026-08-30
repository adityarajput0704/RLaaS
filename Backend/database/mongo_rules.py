from Backend.database.mongodb import rules

def create_rule(rule_data):
    rules.insert_one(rule_data)
    return rule_data["rule_id"]

def create_rules(rule_data):
    rules.insert_many(rule_data)
    return (rule["rule_id"] for rule in rule_data)

def get_rule(rule_id):
    return rules.find_one({
        "rule_id": rule_id
    })

def get_rules(query = None):
    if query:
        return list(rules.find(query))

    return list(rules.find())

def update_one_rule(rule_id, update_data):
    return rules.update_one(
        {"rule_id" : rule_id},
        {"$set": update_data}
    )

def replace_rule(rule_id, rule_data):
    return rules.replace_one(
        {"rule_id": rule_id},
        rule_data
    )

def delete_one(rule_id):
    return rules.delete_one({"rule_id": rule_id})