"""014_activities many_to_many

Revision ID: 8082892f5347
Revises: ee73a63e75fb
Create Date: 2025-02-16 13:13:12.116688

"""
from typing import Sequence, Union

import fastapi_users_db_sqlalchemy
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8082892f5347'
down_revision: Union[str, None] = 'ee73a63e75fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('activity_registry',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('activity_id', sa.BigInteger(), nullable=False),
    sa.Column('user_id', fastapi_users_db_sqlalchemy.generics.GUID(), nullable=False),
    sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.drop_constraint('user_activity_id_fkey', 'user', type_='foreignkey')
    op.drop_column('user', 'activity_id')


def downgrade() -> None:
    op.add_column('user', sa.Column('activity_id', sa.BIGINT(), autoincrement=False, nullable=True))
    op.create_foreign_key('user_activity_id_fkey', 'user', 'activities', ['activity_id'], ['id'], ondelete='SET NULL')
    op.drop_table('activity_registry')
