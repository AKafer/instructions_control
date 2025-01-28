"""10_add norms

Revision ID: d3b5c5238b6e
Revises: 16fad3627914
Create Date: 2025-01-28 20:49:40.215545

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3b5c5238b6e'
down_revision: Union[str, None] = '16fad3627914'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('norms',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('title', sa.String(length=320), nullable=False),
    sa.Column('profession_id', sa.BigInteger(), nullable=True),
    sa.Column('activity_id', sa.BigInteger(), nullable=True),
    sa.CheckConstraint('((profession_id IS NOT NULL AND activity_id IS NULL) OR (profession_id IS NULL AND activity_id IS NOT NULL))', name='chk_profession_xor_activity'),
    sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['profession_id'], ['professions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('activity_id'),
    sa.UniqueConstraint('profession_id')
    )
    op.create_table('norm_materials',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('norm_id', sa.BigInteger(), nullable=False),
    sa.Column('material_type_id', sa.BigInteger(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=True),
    sa.Column('period', sa.Integer(), nullable=True),
    sa.Column('npa_link', sa.String(length=320), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['material_type_id'], ['material_types.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['norm_id'], ['norms.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('norm_materials')
    op.drop_table('norms')
