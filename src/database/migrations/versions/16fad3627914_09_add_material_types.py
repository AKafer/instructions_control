"""09 add material_types

Revision ID: 16fad3627914
Revises: ce25f7d8107c
Create Date: 2025-01-27 19:57:11.804750

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '16fad3627914'
down_revision: Union[str, None] = 'ce25f7d8107c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('material_types',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('title', sa.String(length=64), nullable=False),
    sa.Column('unit_of_measurement', sa.Enum('KG', 'L', 'PCS', 'M', 'M2', 'M3', 'T', 'BAG', 'ROLL', 'SET', 'BOX', 'BOTTLE', 'CAN', 'KIT', 'UNIT', 'PIECE', 'PAIR', 'BUNDLE', 'PACK', 'PALLET', 'CONTAINER', 'DRUM', 'TUBE', 'BARREL', 'BUCKET', 'CRATE', 'TRAY', 'RACK', 'SHEET', 'COIL', name='unit_of_measurement'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('title')
    )


def downgrade() -> None:
    op.drop_table('material_types')

