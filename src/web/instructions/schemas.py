from datetime import datetime

from fastapi import Form
from fastapi_users import models

from pydantic import BaseModel, Field


class Journal(BaseModel):
    id: int
    user_uuid: models.ID
    last_date_read: datetime | None
    valid: bool | None = None
    remain_days: int | None = None
    link: str | None = None
    signature: str | None = Field(None, exclude=True)

    class Config:
        orm_mode = True


class Instruction(BaseModel):
    id: int
    link: str | None = None
    title: str
    number: str | None
    iteration: bool = False
    period: int | None
    filename: str | None = Field(None, exclude=True)

    class Config:
        orm_mode = True


class InstructionForUser(Instruction):
    journal: Journal | None


class InstructionCreateInput(BaseModel):
    title: str
    number: str | None
    iteration: bool = False
    period: int | None

    @classmethod
    def as_form(
        cls,
        title: str = Form(...),
        number: str = Form(None),
        iteration: bool = Form(False),
        period: int = Form(None),
    ):
        return cls(title=title, number=number, iteration=iteration, period=period)


class InstructionUpdateInput(BaseModel):
    title: str | None = None
    number: str | None = None
    iteration: bool | None = None
    period: int | None = None

    @classmethod
    def as_form(
            cls,
            title: str = Form(None),
            number: str = Form(None),
            iteration: bool = Form(None),
            period: int = Form(None),
    ):
        return cls(title=title, number=number, iteration=iteration, period=period)
