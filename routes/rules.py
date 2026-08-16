from fastapi import APIRouter, HTTPException
from database.mongo_rules import create_rule, get_rules, get_rule
from database.mongodb import rules
from models.rule import RuleCreate
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

@router.get("/")
def get_all_rules():
    rules = get_rules()
    return (serialize_rules(rule) for rule in rules) 

@router.get("/rule_id")
def get_one_rule(rule_id: str):
    
    rule = get_rule(rule_id)

    if not rule: 
        raise HTTPException(
            status_code=404,
            detail= "Rule not found"
        )

    return serialize_rules(rule)