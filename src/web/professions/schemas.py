from pydantic import BaseModel

from web.instructions.schemas import Instruction


class Profession(BaseModel):
    id: int
    title: str
    description: str | None
    instructions: list[Instruction]

    class Config:
        orm_mode = True


class ProfessionCreateInput(BaseModel):
    title: str
    description: str | None


class ProfessionUpdateInput(BaseModel):
    title: str | None = None
    description: str | None = None
