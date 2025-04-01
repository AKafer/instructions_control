from fastapi import Form
from pydantic import BaseModel, Field


class TrainingModule(BaseModel):
    id: int
    instruction_id: int
    title: str
    description: str | None
    order_index: int
    link: str | None
    filename: str | None = Field(None, exclude=True)

    class Config:
        orm_mode = True


class TrainingModuleCreateInput(BaseModel):
    instruction_id: int
    title: str
    description: str | None
    order_index: int

    @classmethod
    def as_form(
        cls,
        instruction_id: int = Form(...),
        title: str = Form(...),
        description: str = Form(None),
        order_index: int = Form(...),
    ):
        return cls(
            instruction_id=instruction_id,
            title=title,
            description=description,
            order_index=order_index,
        )


class TrainingModuleUpdateInput(BaseModel):
    title: str | None
    description: str | None
    order_index: int | None

    @classmethod
    def as_form(
        cls,
        title: str = Form(None),
        description: str = Form(None),
        order_index: int = Form(None),
    ):
        return cls(
            title=title,
            description=description,
            order_index=order_index,
        )
