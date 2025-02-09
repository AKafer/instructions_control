"""013_add size_type column

Revision ID: ee73a63e75fb
Revises: 64bdda29bdbe
Create Date: 2025-02-09 12:43:25.904364

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee73a63e75fb'
down_revision: Union[str, None] = '64bdda29bdbe'
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
        'norm_materials',
        sa.Column('size_type', size_enum, nullable=True)
    )


def downgrade() -> None:
    op.drop_column('norm_materials', 'size_type')
    size_enum = sa.Enum(
        'clothing_size',
        'shoe_size',
        'head_size',
        'mask_size',
        'gloves_size',
        'mitten_size',
        name='size_type_enum'
    )
    size_enum.drop(op.get_bind(), checkfirst=True)
