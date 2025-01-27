from pydantic import BaseModel

from web.instructions.schemas import Instruction


class Activity(BaseModel):
    id: int
    title: str
    description: str | None

    class Config:
        orm_mode = True


class ActivityCreateInput(BaseModel):
    title: str
    description: str | None


class ActivityUpdateInput(BaseModel):
    title: str | None = None
    description: str | None = None
