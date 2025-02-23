from fastapi import UploadFile, File, Form
from pydantic import BaseModel, validator


class RuleCreateInput(BaseModel):
    profession_id: int
    instruction_id: int
    description: str | None


class Rule(BaseModel):
    id: int
    profession_id: int
    instruction_id: int
    description: str | None

    class Config:
        orm_mode = True


class RuleCreateManyInput(BaseModel):
    instruction_id: int
    profession_ids: list[int] | None = None
    bind_to_all: bool = False
