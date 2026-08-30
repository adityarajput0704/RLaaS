from fastapi import HTTPException
from Backend.config.algorithm_registry import ALGORITHMS


def validate_algorithm(algorithm: str):

    if algorithm not in ALGORITHMS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported algorithm: {algorithm}"
        )

def validate_config(algorithm: str, config: dict):

    required_fields = ALGORITHMS[algorithm]["required"]

    # Reject fields that don't belong to this algorithm
    allowed_fields = set(required_fields)

    for field in config:
        if field not in allowed_fields:
            raise HTTPException(
                status_code=400,
                detail=f"'{field}' is not valid for {algorithm}"
            )

    # Validate required fields
    for field in required_fields:
        value = config.get(field)

        if value is None:
            raise HTTPException(
                status_code=400,
                detail=f"{algorithm} requires '{field}'"
            )

        if value <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"'{field}' must be greater than 0"
            )

def validate_method(method: str):

    if not method.strip():
        raise HTTPException(
            status_code=400,
            detail="Method cannot be empty"
        )


def validate_resource(resource: str):

    if not resource.strip():
        raise HTTPException(
            status_code=400,
            detail="Resource cannot be empty"
        )