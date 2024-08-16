from pydantic import BaseModel, ConfigDict


class Profession(BaseModel):
    id: int
    title: str
    description: str | None

    class Config:
        orm_mode = True


class ProfessionCreateInput(BaseModel):
    title: str
    description: str | None


class ProfessionUpdateInput(BaseModel):
    title: str | None = None
    description: str | None = None
