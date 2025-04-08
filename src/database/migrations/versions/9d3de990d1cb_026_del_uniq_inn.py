"""026_del_uniq_inn

Revision ID: 9d3de990d1cb
Revises: a926edc11488
Create Date: 2025-04-08 09:44:23.877240

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d3de990d1cb'
down_revision: Union[str, None] = 'a926edc11488'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('user_inn_key', 'user', type_='unique')
    op.drop_constraint('user_snils_key', 'user', type_='unique')


def downgrade() -> None:
    op.create_unique_constraint('user_snils_key', 'user', ['snils'])
    op.create_unique_constraint('user_inn_key', 'user', ['inn'])
