"""02_add_rules

Revision ID: 86d9b89124aa
Revises: 966419af1456
Create Date: 2024-08-11 12:29:40.627784

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '86d9b89124aa'
down_revision: Union[str, None] = '966419af1456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('rules',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column(
        'profession_id',
        sa.BigInteger(),
        sa.ForeignKey("professions.id", ondelete="CASCADE"),
        nullable=False
    ),
    sa.Column(
        'instruction_id',
        sa.BigInteger(),
        sa.ForeignKey("instructions.id", ondelete="CASCADE"),
        nullable=False
    ),
    sa.Column('description', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('profession_id', 'instruction_id', name='uix_1')
    )


def downgrade() -> None:
    op.drop_table('rules')
