"""016_add_constraint_norm_meterial_type

Revision ID: 294df4679323
Revises: 3b4d0ac081dd
Create Date: 2025-02-16 14:50:02.314421

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '294df4679323'
down_revision: Union[str, None] = '3b4d0ac081dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint('uix_4', 'norm_materials', ['norm_id', 'material_type_id'])


def downgrade() -> None:
    op.drop_constraint('uix_4', 'norm_materials', type_='unique')
