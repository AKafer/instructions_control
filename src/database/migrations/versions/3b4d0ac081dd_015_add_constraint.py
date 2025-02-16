"""015_add_constraint

Revision ID: 3b4d0ac081dd
Revises: 8082892f5347
Create Date: 2025-02-16 13:43:28.815272

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b4d0ac081dd'
down_revision: Union[str, None] = '8082892f5347'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint('uix_3', 'activity_registry', ['activity_id', 'user_id'])


def downgrade() -> None:
    op.drop_constraint('uix_3', 'activity_regisry', type_='unique')
