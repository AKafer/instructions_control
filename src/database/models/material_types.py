import enum
from enum import Enum

import sqlalchemy as sa

from database.orm import BaseModel


class SizeType(str, enum.Enum):
    clothing_size = "clothing_size"
    shoe_size = "shoe_size"
    head_size = "head_size"
    mask_size = "mask_size"
    gloves_size = "gloves_size"
    mitten_size = "mitten_size"


class MaterialTypes(BaseModel):
    __tablename__ = 'material_types'

    class Units(str, Enum):
        PCS = 'шт'
        PAIR = 'пар'
        ML = 'мл'
        GR = 'гр'
        COMPLETE = 'компл'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(320), nullable=False, unique=True)
    unit_of_measurement = sa.Column(
        sa.Enum(
            Units,
            name='unit_of_measurement',
            values_callable=lambda enum: [member.value for member in enum]
        ),
        nullable=False
    )
    size_type = sa.Column(
        sa.Enum(SizeType, name="size_type_enum"),
        nullable=True
    )

    norms_materials = sa.orm.relationship('NormMaterials', back_populates='material_type')

    materials = sa.orm.relationship(
        'Materials',
        back_populates='material_type',
        lazy='selectin',
        cascade="all, delete, delete-orphan",
        single_parent=True,
    )
