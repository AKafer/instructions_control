from pydantic import BaseModel


class Profession(BaseModel):
    id: int
    title: str
    description: str | None

    class Config:
        orm_mode = True


class ProfessionCreateInput(BaseModel):
    title: str
    description: str | None

    class Config:
        orm_mode = True


class ProfessionUpdateInput(BaseModel):
    title: str | None = None
    description: str | None = None

    class Config:
        orm_mode = True
