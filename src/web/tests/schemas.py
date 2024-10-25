from pydantic import BaseModel, Json


class TemplateInput(BaseModel):
    content: list[dict]


class Template(BaseModel):
    id: int
    content: list[dict]

    class Config:
        orm_mode = True
