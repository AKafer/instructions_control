"""020_add_number_of_document

Revision ID: f62bd6d6528a
Revises: 4390901e3205
Create Date: 2025-03-09 12:05:28.103368

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f62bd6d6528a'
down_revision: Union[str, None] = '4390901e3205'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('materials', sa.Column('number_of_document', sa.String(length=320), nullable=True))
    op.drop_column('materials', 'size')


def downgrade() -> None:
    op.add_column('materials', sa.Column('size', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.drop_column('materials', 'number_of_document')
