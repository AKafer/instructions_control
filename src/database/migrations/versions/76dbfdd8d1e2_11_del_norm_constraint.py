"""11_del_norm_constraint

Revision ID: 76dbfdd8d1e2
Revises: d3b5c5238b6e
Create Date: 2025-02-01 11:34:56.725157

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76dbfdd8d1e2'
down_revision: Union[str, None] = 'd3b5c5238b6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('chk_profession_xor_activity', 'norms')


def downgrade() -> None:
    pass
