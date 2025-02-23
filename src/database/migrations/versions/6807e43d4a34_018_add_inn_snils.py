"""018_add_inn_snils

Revision ID: 6807e43d4a34
Revises: 4305833f435b
Create Date: 2025-02-23 08:42:35.073076

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6807e43d4a34'
down_revision: Union[str, None] = '4305833f435b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user', sa.Column('inn', sa.String(length=320), nullable=True))
    op.add_column('user', sa.Column('snils', sa.String(length=320), nullable=True))
    op.add_column('user', sa.Column('date_of_birth', sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint(None, 'user', ['inn'])
    op.create_unique_constraint(None, 'user', ['snils'])


def downgrade() -> None:
    op.drop_constraint(None, 'user', type_='unique')
    op.drop_constraint(None, 'user', type_='unique')
    op.drop_column('user', 'date_of_birth')
    op.drop_column('user', 'snils')
    op.drop_column('user', 'inn')
