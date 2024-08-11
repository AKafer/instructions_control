from fastapi import Form

from pydantic import BaseModel


class Instruction(BaseModel):
    id: int
    filename: str | None
    title: str
    number: str
    iteration: bool = False
    period: int | None

    class Config:
        orm_mode = True


class InstructionInput(BaseModel):
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


class InstructionUpdate(BaseModel):
    title: str | None
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
