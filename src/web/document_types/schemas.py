from typing import List

from pydantic import BaseModel, Field

from database.models.material_types import MaterialTypes, SizeType


class DocumentType(BaseModel):
    id: int
    title: str | None = None
    description: str | None = None
    period: int | None = None

    class Config:
        orm_mode = True


class DocumentTypeCreateInput(BaseModel):
    title: str
    description: str | None = None
    period: int | None = None


class DocumentTypeUpdateInput(BaseModel):
    title: str | None = None
    description: str | None = None
    period: int | None = None
