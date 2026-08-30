from fastapi import APIRouter, HTTPException, Depends

from Backend.database.mongo_rules import (
    create_rule,
    create_rules,
    get_rules,
    get_rule,
    replace_rule,
    delete_one,
    update_one_rule
)

from Backend.database.mongodb import rules

from Backend.models.rule import (
    RuleCreate,
    RuleUpdate,
    RulePatch
)

import uuid

from Backend.config.validation import (
    validate_algorithm,
    validate_config,
    validate_method,
    validate_resource
)

from Backend.config.cache import invalidate_cache
from Backend.auth.api_key import get_authenticated_app
from Backend.auth.authorization import verify_app_access
from Backend.auth.management_limit import check_management_limit

router = APIRouter(
    prefix="/rules",
    tags=["Rules"],
    dependencies=[Depends(check_management_limit)]
)


def serialize_rules(rule):
    rule["_id"] = str(rule["_id"])
    return rule


def find_existing_rule(app_id, method, resource):
    return rules.find_one({
        "app_id": app_id,
        "method": method,
        "resource": resource
    })


# ---------------------------------------------------------
# CREATE
# ---------------------------------------------------------

@router.post("/")
def create(
    rule: RuleCreate,
    app_id: str = Depends(get_authenticated_app)
):

    rule_data = rule.model_dump(exclude_none=True)

    # Always use authenticated application
    rule_data["app_id"] = app_id

    rule_data["method"] = rule_data["method"].upper()

    validate_method(rule_data["method"])
    validate_resource(rule_data["resource"])
    validate_algorithm(rule_data["algorithm"])

    validate_config(
        rule_data["algorithm"],
        rule_data["config"]
    )

    existing_rule = find_existing_rule(
        app_id,
        rule_data["method"],
        rule_data["resource"]
    )

    if existing_rule:
        raise HTTPException(
            status_code=409,
            detail="Rule already exists"
        )

    rule_data["rule_id"] = f"rule_{uuid.uuid4().hex[:8]}"

    rule_id = create_rule(rule_data)

    invalidate_cache(
        app_id,
        rule_data["method"],
        rule_data["resource"]
    )

    return {
        "message": "Rules created successfully",
        "rule_id": str(rule_id)
    }


# ---------------------------------------------------------
# BULK CREATE
# ---------------------------------------------------------

@router.post("/bulk")
def create_many_rules(
    rules_data: list[RuleCreate],
    app_id: str = Depends(get_authenticated_app)
):

    documents = []
    seen_rules = set()

    for rule in rules_data:

        rule_data = rule.model_dump(exclude_none=True)

        # Never trust app_id from request
        rule_data["app_id"] = app_id

        rule_data["method"] = rule_data["method"].upper()

        validate_method(rule_data["method"])
        validate_resource(rule_data["resource"])
        validate_algorithm(rule_data["algorithm"])

        validate_config(
            rule_data["algorithm"],
            rule_data["config"]
        )

        rule_key = (
            rule_data["method"],
            rule_data["resource"]
        )

        if rule_key in seen_rules:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Duplicate rule in request: "
                    f"{rule_data['method']} "
                    f"{rule_data['resource']}"
                )
            )

        seen_rules.add(rule_key)

        existing_rule = find_existing_rule(
            app_id,
            rule_data["method"],
            rule_data["resource"]
        )

        if existing_rule:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Rule already exists: "
                    f"{rule_data['method']} "
                    f"{rule_data['resource']}"
                )
            )

        rule_data["rule_id"] = f"rule_{uuid.uuid4().hex[:8]}"

        documents.append(rule_data)

    rule_ids = create_rules(documents)

    return {
        "message": "Rules created successfully",
        "rule_ids": list(rule_ids)
    }


# ---------------------------------------------------------
# GET ALL
# ---------------------------------------------------------

@router.get("/")
def get_all_rules(
    app_id: str = Depends(get_authenticated_app)
):

    rules_list = get_rules({
        "app_id": app_id
    })

    return [
        serialize_rules(rule)
        for rule in rules_list
    ]


# ---------------------------------------------------------
# GET ONE
# ---------------------------------------------------------

@router.get("/{rule_id}")
def get_one_rule(
    rule_id: str,
    app_id: str = Depends(get_authenticated_app)
):

    rule = get_rule(rule_id)

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    verify_app_access(rule, app_id)

    return serialize_rules(rule)


# ---------------------------------------------------------
# REPLACE
# ---------------------------------------------------------

@router.put("/{rule_id}")
def replace_rule_endpoint(
    rule_id: str,
    rule: RuleUpdate,
    app_id: str = Depends(get_authenticated_app)
):

    existing_rule = get_rule(rule_id)

    if not existing_rule:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    verify_app_access(existing_rule, app_id)

    rule_data = rule.model_dump(exclude_none=True)

    # Never trust app_id from request
    rule_data["app_id"] = app_id

    rule_data["method"] = rule_data["method"].upper()

    validate_method(rule_data["method"])
    validate_resource(rule_data["resource"])
    validate_algorithm(rule_data["algorithm"])

    validate_config(
        rule_data["algorithm"],
        rule_data["config"]
    )

    conflicting_rule = find_existing_rule(
        app_id,
        rule_data["method"],
        rule_data["resource"]
    )

    if (
        conflicting_rule
        and conflicting_rule["rule_id"] != rule_id
    ):
        raise HTTPException(
            status_code=409,
            detail="Another rule already exists for this method and resource"
        )

    rule_data["rule_id"] = rule_id

    result = replace_rule(
        rule_id,
        rule_data
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    # Invalidate old cache
    invalidate_cache(
        existing_rule["app_id"],
        existing_rule["method"],
        existing_rule["resource"]
    )

    # Invalidate new cache
    invalidate_cache(
        app_id,
        rule_data["method"],
        rule_data["resource"]
    )

    return {
        "message": "Replaced successfully",
        "rule_id": rule_id
    }


# ---------------------------------------------------------
# PATCH
# ---------------------------------------------------------

@router.patch("/{rule_id}")
def patch_rule(
    rule_id: str,
    rule: RulePatch,
    app_id: str = Depends(get_authenticated_app)
):

    existing_rule = get_rule(rule_id)

    if not existing_rule:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    verify_app_access(existing_rule, app_id)

    update_data = rule.model_dump(
        exclude_unset=True,
        exclude_none=True
    )

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided"
        )

    if "method" in update_data:

        update_data["method"] = update_data["method"].upper()

        validate_method(
            update_data["method"]
        )

    if "resource" in update_data:

        validate_resource(
            update_data["resource"]
        )

    new_algorithm = update_data.get(
    "algorithm",
    existing_rule["algorithm"]
    )

    validate_algorithm(new_algorithm)

    patch_config = update_data.get("config")

    if new_algorithm != existing_rule["algorithm"]:

        if not patch_config:
            raise HTTPException(
                status_code=400,
                detail="Config is required when changing algorithm"
            )

        new_config = patch_config.copy()

    else:

        new_config = existing_rule.get(
            "config",
            {}
        ).copy()

    if patch_config:
        new_config.update(patch_config)

    validate_config(
        new_algorithm,
        new_config
    )

    update_data.pop("config", None)

    if new_algorithm != existing_rule["algorithm"]:

        update_data["config"] = new_config

    elif patch_config:

        for key, value in patch_config.items():
            update_data[f"config.{key}"] = value

    new_method = update_data.get(
        "method",
        existing_rule["method"]
    )

    new_resource = update_data.get(
        "resource",
        existing_rule["resource"]
    )

    conflicting_rule = find_existing_rule(
        app_id,
        new_method,
        new_resource
    )

    if (
        conflicting_rule
        and conflicting_rule["rule_id"] != rule_id
    ):
        raise HTTPException(
            status_code=409,
            detail="Another rule already exists for this method and resource"
        )

    result = update_one_rule(
        rule_id,
        update_data
    )

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
        app_id,
        new_method,
        new_resource
    )

    return {
        "message": "Updated Successfully",
        "rule_id": rule_id
    }


# ---------------------------------------------------------
# DELETE
# ---------------------------------------------------------

@router.delete("/{rule_id}")
def delete_rule(
    rule_id: str,
    app_id: str = Depends(get_authenticated_app)
):

    existing_rule = get_rule(rule_id)

    if not existing_rule:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    verify_app_access(existing_rule, app_id)

    result = delete_one(rule_id)

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    invalidate_cache(
        existing_rule["app_id"],
        existing_rule["method"],
        existing_rule["resource"]
    )

    return {
        "message": "Deleted Successfully"
    }