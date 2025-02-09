from pydantic import BaseModel

from database.models.material_types import MaterialTypes


class MaterialType(BaseModel):
    id: int
    title: str
    unit_of_measurement: MaterialTypes.Units

    class Config:
        orm_mode = True


class MaterialTypeCreateInput(BaseModel):
    title: str | None = None
    unit_of_measurement: MaterialTypes.Units | None = None


class MaterialTypeUpdateInput(BaseModel):
    title: str | None = None
    unit_of_measurement: MaterialTypes.Units | None = None


class CalculateNeedInput(BaseModel):
    list_of_material_ids: list[int]
