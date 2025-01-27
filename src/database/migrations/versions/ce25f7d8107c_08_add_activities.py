"""08_add activities

Revision ID: ce25f7d8107c
Revises: 9015981b0de4
Create Date: 2025-01-27 08:21:11.572490

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce25f7d8107c'
down_revision: Union[str, None] = '9015981b0de4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('activities',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('title', sa.String(length=64), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('title')
    )
    op.add_column('user', sa.Column('activity_id', sa.BigInteger(), nullable=True))
    op.create_foreign_key(None, 'user', 'activities', ['activity_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint(None, 'user', type_='foreignkey')
    op.drop_column('user', 'activity_id')
    op.drop_table('activities')
