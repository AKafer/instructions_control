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
        KG = 'KG'
        L = 'L'
        PCS = 'PCS'
        M = 'M'
        M2 = 'M2'
        M3 = 'M3'
        T = 'T'
        BAG = 'BAG'
        ROLL = 'ROLL'
        SET = 'SET'
        BOX = 'BOX'
        BOTTLE = 'BOTTLE'
        CAN = 'CAN'
        KIT = 'KIT'
        UNIT = 'UNIT'
        PIECE = 'PIECE'
        PAIR = 'PAIR'
        BUNDLE = 'BUNDLE'
        PACK = 'PACK'
        PALLET = 'PALLET'
        CONTAINER = 'CONTAINER'
        DRUM = 'DRUM'
        TUBE = 'TUBE'
        BARREL = 'BARREL'
        BUCKET = 'BUCKET'
        CRATE = 'CRATE'
        TRAY = 'TRAY'
        RACK = 'RACK'
        SHEET = 'SHEET'
        COIL = 'COIL'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False, unique=True)
    unit_of_measurement = sa.Column(
        sa.Enum(Units, name='unit_of_measurement'), nullable=False
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
