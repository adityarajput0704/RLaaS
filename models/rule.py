from pydantic import BaseModel, Field
class RuleConfig(BaseModel):
    capacity : int | None= None
    refill_rate: float | None= None
    limit : int | None= None
    window_size: int | None= None

class RuleCreate(BaseModel):
    method: str = Field(min_length=1)
    resource: str = Field(min_length=1)
    algorithm: str
    config : RuleConfig

class RuleUpdate(BaseModel):
    method : str
    resource: str
    algorithm: str
    config : RuleConfig
class RulePatch(BaseModel):
    method: str | None = Field(default=None, min_length=1)
    resource: str | None = Field(default=None, min_length=1)
    algorithm: str | None = Field(default=None, min_length=1)
    config: RuleConfig | None = None