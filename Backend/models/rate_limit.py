from pydantic import BaseModel, Field


class RateLimitRequest(BaseModel):
    user_id: str = Field(min_length=1)
    method: str = Field(min_length=1)
    resource: str = Field(min_length=1)