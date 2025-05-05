"""027_add title for type materials

Revision ID: 7f9dfbf0536c
Revises: 9d3de990d1cb
Create Date: 2025-05-05 09:20:36.690803

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f9dfbf0536c'
down_revision: Union[str, None] = '9d3de990d1cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('material_types', 'title',
               existing_type=sa.VARCHAR(length=64),
               type_=sa.String(length=320),
               existing_nullable=False)



def downgrade() -> None:
    op.alter_column('material_types', 'title',
               existing_type=sa.String(length=320),
               type_=sa.VARCHAR(length=64),
               existing_nullable=False)
