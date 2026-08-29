from pydantic import BaseModel, Field


class AppCreate(BaseModel):
    name: str = Field(min_length=1)