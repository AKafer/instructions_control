from pydantic import BaseModel


class Profession(BaseModel):
    id: int
    title: str
    description: str | None

    class Config:
        orm_mode = True


class ProfessionInput(BaseModel):
    title: str
    description: str | None

    class Config:
        orm_mode = True
