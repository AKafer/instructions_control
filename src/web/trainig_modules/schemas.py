from datetime import datetime

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
    applied: int
    passed: int

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


class TrainingModuleStatus(BaseModel):
    user_id: str
    module_id : int
    module_title: str
    module_description: str | None
    module_order_index: int
    module_link: str | None
    is_completed: bool
    completed_at: datetime | None
