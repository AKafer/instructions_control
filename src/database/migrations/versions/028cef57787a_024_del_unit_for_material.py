"""024_del_unit_for_material

Revision ID: 028cef57787a
Revises: bb5acf13faa9
Create Date: 2025-03-09 14:41:47.811396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '028cef57787a'
down_revision: Union[str, None] = 'bb5acf13faa9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('materials', 'unit_of_measurement')



def downgrade() -> None:
    op.add_column('materials', sa.Column('unit_of_measurement', sa.VARCHAR(length=320), autoincrement=False, nullable=True))
