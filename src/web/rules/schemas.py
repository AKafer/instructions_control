from fastapi import UploadFile, File, Form
from pydantic import BaseModel, validator


class RuleCreateInput(BaseModel):
    profession_id: int
    instruction_id: int
    description: str | None

    class Config:
        orm_mode = True


class Rule(BaseModel):
    id: int
    profession_id: int
    instruction_id: int
    description: str | None

    class Config:
        orm_mode = True
