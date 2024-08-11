import sqlalchemy as sa
from database.orm import BaseModel


class Rules(BaseModel):
    __tablename__ = 'rules'

    id = sa.Column(sa.BigInteger, primary_key=True)
    profession_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey("professions.id", ondelete="CASCADE"),
        nullable=False
    )
    instruction_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey("instructions.id", ondelete="CASCADE"),
        nullable=False,
    )
    description = sa.Column(sa.Text(), nullable=True)

    sa.UniqueConstraint('profession_id', 'instruction_id', name='uix_1')

