"""03 add actual to journal

Revision ID: 8d8abc07e23f
Revises: 9493cea7c525
Create Date: 2024-09-22 16:05:53.583225

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d8abc07e23f'
down_revision: Union[str, None] = '9493cea7c525'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('journals', sa.Column('actual', sa.Boolean(), nullable=True))
    op.execute('UPDATE journals SET actual = TRUE WHERE actual IS NULL')
    op.alter_column('journals', 'actual', nullable=False, existing_type=sa.Boolean())


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('journals', 'actual')
    # ### end Alembic commands ###
