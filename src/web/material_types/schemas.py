from typing import List

from pydantic import BaseModel, Field

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
    with_height: bool = False


class TableFormat(BaseModel):
    size_range: List[str] = Field(
        example=[
            "0-40",
            "40-50",
            "51-60",
            "61-70",
            "71-80",
            "81-90",
            "91-100",
        ]
    )
    height_range: List[str] | None = Field(
        example=[
            "0-130",
            "130-140",
            "141-150",
            "151-160",
            "161-170",
            "171-180",
            "181-190",
            "191-200",
            "201-1000"
        ]
    )
    like_file: bool = False
