from fastapi import HTTPException
from config.algorithm_registry import ALGORITHMS


def validate_algorithm(algorithm: str):

    if algorithm not in ALGORITHMS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported algorithm: {algorithm}"
        )

def validate_config(algorithm: str, config: dict):

    required_fields = ALGORITHMS[algorithm]["required"]

    for field in required_fields:
        if config.get(field) is None or config.get(field) <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"{algorithm} requires '{field}'"
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