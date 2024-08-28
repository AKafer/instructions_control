from pydantic import BaseModel


class Division(BaseModel):
    id: int
    title: str
    description: str | None

    class Config:
        orm_mode = True


class DivisionCreateInput(BaseModel):
    title: str
    description: str | None


class DivisionUpdateInput(BaseModel):
    title: str | None
    description: str | None
