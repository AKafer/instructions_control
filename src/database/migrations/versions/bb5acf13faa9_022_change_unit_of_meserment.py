"""022_change_unit_of_meserment

Revision ID: bb5acf13faa9
Revises: 308cd5de5ff0
Create Date: 2025-03-09 13:47:51.057005

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb5acf13faa9'
down_revision: Union[str, None] = '308cd5de5ff0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE unit_of_measurement RENAME TO unit_of_measurement_old;")
    op.execute("CREATE TYPE unit_of_measurement AS ENUM ('шт', 'пар', 'мл', 'гр', 'компл');")
    op.execute("""
            ALTER TABLE material_types ALTER COLUMN unit_of_measurement
            TYPE unit_of_measurement USING (
                CASE unit_of_measurement::text
                    WHEN 'PCS' THEN 'шт'
                    WHEN 'PAIR' THEN 'пар'
                    WHEN 'ML' THEN 'мл'
                    WHEN 'GR' THEN 'гр'
                    WHEN 'COMPLETE' THEN 'компл'
                    ELSE unit_of_measurement::text
                END
            )::unit_of_measurement;
        """)
    op.execute("DROP TYPE unit_of_measurement_old;")

def downgrade() -> None:
    op.execute("ALTER TYPE unit_of_measurement RENAME TO unit_of_measurement_new;")
    op.execute("CREATE TYPE unit_of_measurement AS ENUM ('PCS', 'PAIR', 'ML', 'GR', 'COMPLETE');")
    op.execute("""
            ALTER TABLE material_types ALTER COLUMN unit_of_measurement
            TYPE unit_of_measurement USING (
                CASE unit_of_measurement::text
                    WHEN 'шт' THEN 'PCS'
                    WHEN 'пар' THEN 'PAIR'
                    WHEN 'мл' THEN 'ML'
                    WHEN 'гр' THEN 'GR'
                    WHEN 'компл' THEN 'COMPLETE'
                    ELSE unit_of_measurement::text
                END
            )::unit_of_measurement;
        """)
    op.execute("DROP TYPE unit_of_measurement_new;")
