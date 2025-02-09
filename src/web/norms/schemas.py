from pydantic import BaseModel

from database.models.material_types import MaterialTypes
from database.models.norms import SizeType


class Profession(BaseModel):
    id: int
    title: str

    class Config:
        orm_mode = True


class Activity(BaseModel):
    id: int
    title: str

    class Config:
        orm_mode = True


class MaterialType(BaseModel):
    id: int
    title: str
    unit_of_measurement: MaterialTypes.Units

    class Config:
        orm_mode = True


class NormMaterial(BaseModel):
    id: int
    material_type: MaterialType
    quantity: float | None = None
    period: int | None = None
    npa_link: str | None = None
    description: str | None = None
    size_type: SizeType | None = None

    class Config:
        orm_mode = True


class Norm(BaseModel):
    id: int
    title: str | None = None
    profession: Profession | None = None
    activity: Activity | None = None
    material_norm_types: list[NormMaterial] | None = None

    class Config:
        orm_mode = True


class NormMaterialCreateInput(BaseModel):
    material_type_id: int
    quantity: float | None = None
    period: int | None = None
    npa_link: str | None = None
    description: str | None = None
    size_type: SizeType | None = None


class NormMaterialList(BaseModel):
    material_type_ids: list[int]

class NormCreateInput(BaseModel):
    title: str
    profession_id: int | None = None
    activity_id: int | None = None

class NormUpdateInput(BaseModel):
    title: str
