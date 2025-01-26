"""07_add add_fiature

Revision ID: 9015981b0de4
Revises: 2502a9a8b7fd
Create Date: 2025-01-26 14:50:14.283999

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9015981b0de4'
down_revision: Union[str, None] = '2502a9a8b7fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user', sa.Column('number', sa.String(length=320), nullable=True))
    op.add_column('user', sa.Column('started_work', sa.DateTime(timezone=True), nullable=True))
    op.add_column('user', sa.Column('changed_profession', sa.DateTime(timezone=True), nullable=True))
    op.add_column('user', sa.Column('additional_features', sa.JSON(), server_default='{}', nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'additional_features')
    op.drop_column('user', 'changed_profession')
    op.drop_column('user', 'started_work')
    op.drop_column('user', 'number')
