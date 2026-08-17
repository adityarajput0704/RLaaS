from fastapi import APIRouter, HTTPException
from database.mongo_rules import create_rule, create_rules, get_rules, get_rule, replace_rule, delete_one, update_one_rule
from database.mongodb import rules
from models.rule import RuleCreate, RuleUpdate, RulePatch
from bson import ObjectId
import uuid

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
    return{
        "message":"Rules created successfully",
        "rule_id": str(rule_id)
    }

@router.post("/bulk")
def create_many_rules(rules_data: list[RuleCreate]):
    documents = []

    for rule in rules_data:

        rule_data = rule.model_dump()

        rule_data["method"] = rule_data["method"].upper()

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
    rule_data["method"]= rule_data["method"].upper()
    rule_data["rule_id"]= rule_id

    result = replace_rule(rule_id, rule_data)

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    return{
        "message" : "Replaced successfully",
        "rule_id": rule_id
    }

@router.patch("/{rule_id}")
def patch_rule(rule_id:str, rule:RulePatch):

    update_data= rule.model_dump(
        exclude_unset = True,
        exclude_none=True
        )

    if "method" in update_data:
        update_data["method"]=update_data["method"].upper()

    if "config" in update_data:
        config = update_data.pop("config")

        for key, value in config.items():
            update_data[f"config.{key}"] = value


    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided"
        )

    result = update_one_rule(rule_id, update_data)

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    return{
        "message":"Updated Successfully",
        "rule_id": rule_id
    }

@router.delete("/{rule_id}")
def delete_rule(rule_id: str):
    delete_one(rule_id)
    return {
        "message": "Deleted Successfully"
    }