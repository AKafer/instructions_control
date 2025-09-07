import uuid
from datetime import datetime, date

from pydantic import BaseModel, Extra

from database.models.material_types import SizeType


class MaterialType(BaseModel):
    id: int
    title: str
    unit_of_measurement: str
    size_type: SizeType | None = None

    class Config:
        orm_mode = True

class Division(BaseModel):
    title: str

    class Config:
        orm_mode = True

class Profession(BaseModel):
    title: str

    class Config:
        orm_mode = True

class User(BaseModel):
    id: uuid.UUID
    name: str
    last_name: str
    division_id: str | None
    profession_id: str | None
    division: Division | None
    profession: Profession | None

    class Config:
        orm_mode = True


class Material(BaseModel):
    id: int
    user: User
    material_type: MaterialType
    sertificate: str | None
    start_date: date | None
    end_date: date | None
    term_to_control: int | None
    period: int | None
    number_of_document: str | None
    quantity: int | None

    class Config:
        orm_mode = True

class CreateMaterial(BaseModel):
    user_id: str
    material_type_id: int
    sertificate: str | None
    start_date: date | None
    period: int | None
    number_of_document: str | None
    quantity: int | None

    class Config:
        extra = Extra.allow


class MaterialData(BaseModel):
    material_type_id: int
    sertificate: str | None
    start_date: date | None
    period: int | None
    quantity: int | None


class CreateMaterialBulk(BaseModel):
    user_id: str
    number_of_document: str | None
    materials_data: list[MaterialData]

    class Config:
        extra = Extra.allow


class UpdateMaterial(BaseModel):
    sertificate: str | None
    start_date: date | None
    period: int | None
    number_of_document: str | None
    quantity: int | None

    class Config:
        extra = Extra.allow


class AddMaterials(BaseModel):
    materials: list[CreateMaterial]


class DeleteMaterials(BaseModel):
    material_ids: list[int]
