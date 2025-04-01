"""025_add modules

Revision ID: a926edc11488
Revises: 028cef57787a
Create Date: 2025-03-30 14:27:41.826013

"""
from typing import Sequence, Union

import fastapi_users_db_sqlalchemy
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a926edc11488'
down_revision: Union[str, None] = '028cef57787a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('training_modules',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('instruction_id', sa.BigInteger(), nullable=False),
    sa.Column('title', sa.String(length=640), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(length=640), nullable=True),
    sa.ForeignKeyConstraint(['instruction_id'], ['instructions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('training_module_progresses',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('user_id', fastapi_users_db_sqlalchemy.generics.GUID(), nullable=False),
    sa.Column('module_id', sa.BigInteger(), nullable=False),
    sa.Column('is_completed', sa.Boolean(), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['module_id'], ['training_modules.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('training_module_progresses')
    op.drop_table('training_modules')
