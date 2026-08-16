from pydantic import BaseModel

class RuleConfig(BaseModel):
    capacity : int | None= None
    refill_rate: float | None= None
    limit : int | None= None
    window_size: int | None= None

class RuleCreate(BaseModel):
    app_id: str
    method : str
    resource: str
    algorithm: str
    config : RuleConfig

class RuleUpdate(BaseModel):
    app_id: str
    method : str
    resource: str
    algorithm: str
    config : RuleConfig