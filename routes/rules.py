from fastapi import APIRouter, HTTPException
from database.mongo_rules import create_rule, create_rules, get_rules, get_rule, replace_rule, delete_one, update_one_rule
from database.mongodb import rules
from models.rule import RuleCreate, RuleUpdate, RulePatch
from bson import ObjectId
import uuid
from config.validation import validate_algorithm, validate_config, validate_method, validate_resource
from config.cache import invalidate_cache
router = APIRouter(prefix ="/rules", tags=["Rules"])

def serialize_rules(rule):
    rule["_id"]= str(rule["_id"])
    return rule

def find_existing_rule(app_id, method, resource):
    return rules.find_one({
        "app_id": app_id,
        "method": method,
        "resource": resource
    })

@router.post("/")
def create(rule: RuleCreate):

    rule_data = rule.model_dump()
    
    rule_data["method"] = rule_data["method"].upper()

    validate_method(rule_data["method"])
    validate_resource(rule_data["resource"])

    validate_algorithm(rule_data["algorithm"])
    validate_config(
        rule_data["algorithm"],
        rule_data["config"]
    )

    existing_rule = find_existing_rule(
       rule_data["app_id"],
       rule_data["method"],
       rule_data["resource"]
    )

    if existing_rule: 
        return{
            "message": "Rule already Exists",
            "rule_id": existing_rule["rule_id"]
        }
    
    rule_data["rule_id"] = f"rule_{uuid.uuid4().hex[:8]}"
    
    rule_id = create_rule(rule_data)

    invalidate_cache(
    rule_data["app_id"],
    rule_data["method"],
    rule_data["resource"]
    )
    return{
        "message":"Rules created successfully",
        "rule_id": str(rule_id)
    }

@router.post("/bulk")
@router.post("/bulk")
def create_many_rules(rules_data: list[RuleCreate]):
    documents = []
    seen_rules = set()

    for rule in rules_data:

        rule_data = rule.model_dump()

        rule_data["method"] = rule_data["method"].upper()

        validate_method(rule_data["method"])
        validate_resource(rule_data["resource"])
        validate_algorithm(rule_data["algorithm"])
        validate_config(
            rule_data["algorithm"],
            rule_data["config"]
        )

        # Identify a rule uniquely
        rule_key = (
            rule_data["app_id"],
            rule_data["method"],
            rule_data["resource"]
        )

        # Duplicate inside this bulk request
        if rule_key in seen_rules:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Duplicate rule in request: "
                    f"{rule_data['method']} {rule_data['resource']}"
                )
            )

        seen_rules.add(rule_key)

        # Already exists in MongoDB
        existing_rule = find_existing_rule(
            rule_data["app_id"],
            rule_data["method"],
            rule_data["resource"]
        )

        if existing_rule:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Rule already exists: "
                    f"{rule_data['method']} {rule_data['resource']}"
                )
            )

        rule_data["rule_id"] = f"rule_{uuid.uuid4().hex[:8]}"

        documents.append(rule_data)

    rule_ids = create_rules(documents)

    return {
        "message": "Rules created successfully",
        "rule_ids": rule_ids
    }

@router.get("/")
def get_all_rules():
    rules = get_rules()
    return (serialize_rules(rule) for rule in rules) 


@router.get("/{rule_id}")
def get_one_rule(rule_id: str):
    
    rule = get_rule(rule_id)

    if not rule: 
        raise HTTPException(
            status_code=404,
            detail= "Rule not found"
        )

    return serialize_rules(rule)

@router.put("/{rule_id}")
def replace_rule(rule_id: str, rule:RuleUpdate):

    rule_data = rule.model_dump()

    existing_rule = find_existing_rule(
           rule_data["app_id"],
           rule_data["method"],
           rule_data["resource"]
        )
    
    if not existing_rule: 
        raise HTTPException(
            status_code=404,
            detail="Rule not found. please create one"
        )
    
    rule_data["method"]= rule_data["method"].upper()

    validate_method(rule_data["method"])
    validate_resource(rule_data["resource"])

    validate_algorithm(rule_data["algorithm"])
    validate_config(
        rule_data["algorithm"],
        rule_data["config"]
    )

    rule_data["rule_id"]= rule_id

    result = replace_rule(rule_id, rule_data)

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    invalidate_cache(
        existing_rule["app_id"],
        existing_rule["method"],
        existing_rule["resource"]
    )

    invalidate_cache(
        rule_data["app_id"],
        rule_data["method"],
        rule_data["resource"]
        )

    return{
        "message" : "Replaced successfully",
        "rule_id": rule_id
    }

@router.patch("/{rule_id}")
def patch_rule(rule_id:str, rule:RulePatch):

    existing_rule = get_rule(rule_id)

    if not existing_rule:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )
    update_data= rule.model_dump(
        exclude_unset = True,
        exclude_none=True
        )

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided"
        )

    if "method" in update_data:
        update_data["method"] = update_data["method"].upper()
        validate_method(update_data["method"])

    if "resource" in update_data:
        validate_resource(update_data["resource"])

    new_algorithm = update_data.get(
        "algorithm", 
        existing_rule["algorithm"]
    )

    validate_algorithm(new_algorithm)

    new_config = existing_rule.get("config", {}).copy()

    patch_config = update_data.get("config")

    if patch_config:
        new_config.update(patch_config)

    validate_config(
        new_algorithm,
        new_config
    )

    patch_config = update_data.pop("config", None)

    if patch_config:
        for key, value in patch_config.items():
            update_data[f"config.{key}"] = value

    result = update_one_rule(rule_id, update_data)

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    invalidate_cache(
        existing_rule["app_id"],
        existing_rule["method"],
        existing_rule["resource"]
    )

    return{
        "message":"Updated Successfully",
        "rule_id": rule_id
    }

@router.delete("/{rule_id}")
def delete_rule(rule_id: str):
    existing_rule = get_rule(rule_id)

    if not existing_rule:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )
    result = delete_one(rule_id)

    invalidate_cache(
        existing_rule["app_id"],
        existing_rule["method"],
        existing_rule["resource"]
    )
    return {
        "message": "Deleted Successfully"
    }