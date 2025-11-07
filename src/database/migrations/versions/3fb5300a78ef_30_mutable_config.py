"""30_mutable_config

Revision ID: 3fb5300a78ef
Revises: 0aed095d53c7
Create Date: 2025-11-07 14:44:16.768340

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3fb5300a78ef'
down_revision: Union[str, None] = '0aed095d53c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('config', 'placeholders',
           existing_type=postgresql.JSON(astext_type=sa.Text()),
           type_=postgresql.JSONB(astext_type=sa.Text()),
           existing_nullable=True)


def downgrade() -> None:
    op.alter_column('config', 'placeholders',
           existing_type=postgresql.JSONB(astext_type=sa.Text()),
           type_=postgresql.JSON(astext_type=sa.Text()),
           existing_nullable=True)
