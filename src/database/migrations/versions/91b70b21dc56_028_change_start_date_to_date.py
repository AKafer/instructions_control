"""028_change_start_date_to_date

Revision ID: 91b70b21dc56
Revises: 7f9dfbf0536c
Create Date: 2025-09-07 13:11:21.795158

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '91b70b21dc56'
down_revision: Union[str, None] = '7f9dfbf0536c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('materials', 'start_date',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.Date(),
               existing_nullable=True)


def downgrade() -> None:
    op.alter_column('materials', 'start_date',
               existing_type=sa.Date(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=True)
