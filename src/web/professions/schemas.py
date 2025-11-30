from pydantic import BaseModel

from database.models import MaterialTypes
from database.models.material_types import SizeType
from web.instructions.schemas import Instruction


class MaterialType(BaseModel):
    id: int
    title: str
    unit_of_measurement: MaterialTypes.Units
    size_type: SizeType | None = None

    class Config:
        orm_mode = True


class NormMaterial(BaseModel):
    id: int
    material_type: MaterialType
    quantity: float | None = None
    period: int | None = None
    npa_link: str | None = None
    description: str | None = None

    class Config:
        orm_mode = True


class Norm(BaseModel):
    id: int
    title: str | None = None
    material_norm_types: list[NormMaterial] | None = None

    class Config:
        orm_mode = True

class Profession(BaseModel):
    id: int
    title: str
    description: str | None
    instructions: list[Instruction]

    class Config:
        orm_mode = True


class ProfessionDetail(BaseModel):
    id: int
    title: str
    description: str | None
    instructions: list[Instruction]
    norm: Norm | None = None

    class Config:
        orm_mode = True


class ProfessionCreateInput(BaseModel):
    title: str
    description: str | None


class ProfessionUpdateInput(BaseModel):
    title: str | None = None
    description: str | None = None
