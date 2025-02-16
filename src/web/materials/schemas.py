import uuid
from datetime import datetime

from pydantic import BaseModel, Extra

from database.models.material_types import SizeType


class MaterialType(BaseModel):
    id: int
    title: str
    unit_of_measurement: str
    size_type: SizeType | None = None

    class Config:
        orm_mode = True


class User(BaseModel):
    id: uuid.UUID
    name: str
    last_name: str
    division_id: str | None
    profession_id: str | None

    class Config:
        orm_mode = True


class Material(BaseModel):
    id: int
    user: User
    material_type: MaterialType
    sertificate: str | None
    start_date: datetime | None
    period: int | None
    size: float | None
    quantity: int | None
    unit_of_measurement: str | None

    class Config:
        orm_mode = True

class CreateMaterial(BaseModel):
    user_id: str
    material_type_id: int
    sertificate: str | None
    start_date: datetime | None
    period: int | None
    size: float | None
    quantity: int | None
    unit_of_measurement: str | None

    class Config:
        extra = Extra.allow


class UpdateMaterial(BaseModel):
    sertificate: str | None
    start_date: datetime | None
    period: int | None
    size: float | None
    quantity: int | None
    unit_of_measurement: str | None

    class Config:
        extra = Extra.allow


class AddMaterials(BaseModel):
    materials: list[CreateMaterial]


class DeleteMaterials(BaseModel):
    material_ids: list[int]

