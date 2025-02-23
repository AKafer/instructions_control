"""019_file_template

Revision ID: 4390901e3205
Revises: 6807e43d4a34
Create Date: 2025-02-23 14:13:15.205312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4390901e3205'
down_revision: Union[str, None] = '6807e43d4a34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('filetemplates',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('file_name', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('file_name')
    )



def downgrade() -> None:
    op.drop_table('filetemplates')
