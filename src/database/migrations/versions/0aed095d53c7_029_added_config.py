"""029_added_config

Revision ID: 0aed095d53c7
Revises: 91b70b21dc56
Create Date: 2025-11-07 14:07:12.315646

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0aed095d53c7'
down_revision: Union[str, None] = '91b70b21dc56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('config',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('placeholders', sa.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('config')
