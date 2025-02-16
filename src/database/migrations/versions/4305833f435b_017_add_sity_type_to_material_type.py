"""017_add_sity_type_to_material_type

Revision ID: 4305833f435b
Revises: 294df4679323
Create Date: 2025-02-16 15:09:55.813632

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '4305833f435b'
down_revision: Union[str, None] = '294df4679323'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    size_enum = sa.Enum(
        'clothing_size',
        'shoe_size',
        'head_size',
        'mask_size',
        'gloves_size',
        'mitten_size',
        name='size_type_enum'
    )
    size_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'material_types',
        sa.Column('size_type', size_enum, nullable=True)
    )
    op.drop_column('norm_materials', 'size_type')


def downgrade() -> None:
    size_enum = sa.Enum(
        'clothing_size',
        'shoe_size',
        'head_size',
        'mask_size',
        'gloves_size',
        'mitten_size',
        name='size_type_enum'
    )
    size_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'norm_materials',
        sa.Column('size_type', size_enum, nullable=True)
    )
    op.drop_column('material_types', 'size_type')

