import uuid
from datetime import datetime

from pydantic import BaseModel

class Division(BaseModel):
    title: str

    class Config:
        orm_mode = True

class Profession(BaseModel):
    title: str

    class Config:
        orm_mode = True


class User(BaseModel):
    id: uuid.UUID
    name: str
    last_name: str
    division_id: str | None
    profession_id: str | None
    division: Division | None
    profession: Profession | None

    class Config:
        orm_mode = True


class Instruction(BaseModel):
    id: int
    title: str

    class Config:
        orm_mode = True


class Test(BaseModel):
    id: int
    title: str

    class Config:
        orm_mode = True


class History(BaseModel):
    id: int
    type: str | None
    user_uuid: str | uuid.UUID
    journal_id: int
    instruction_id: int | None
    test_id: int | None
    date: str | datetime
    signature: str | None
    additional_data: dict | None
    user: User
    instruction: Instruction | None
    test: Test | None

    class Config:
        orm_mode = True