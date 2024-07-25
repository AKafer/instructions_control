from pydantic import BaseModel


class Instruction(BaseModel):
    id: int
    title: str
    number: str
    text: str | None
    iteration: bool = False
    period: int | None

    class Config:
        orm_mode = True


class InstructionInput(BaseModel):
    title: str
    number: str
    text: str | None
    iteration: bool = False
    period: int | None

    class Config:
        orm_mode = True
