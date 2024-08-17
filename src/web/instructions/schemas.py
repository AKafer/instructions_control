from fastapi import Form

from pydantic import BaseModel


class Instruction(BaseModel):
    id: int
    filename: str | None
    title: str
    number: str | None
    iteration: bool = False
    period: int | None

    class Config:
        orm_mode = True


class InstructionForUser(Instruction):
    valid: bool
    remain_days: int


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
