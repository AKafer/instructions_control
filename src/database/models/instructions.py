import sqlalchemy as sa
from database.orm import BaseModel


class Instructions(BaseModel):
    __tablename__ = 'instructions'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False)
    number = sa.Column(sa.String(64), nullable=False)
    text = sa.Column(sa.Text(), nullable=True)
    iteration = sa.Column(sa.Boolean(), nullable=False, default=False)
    period = sa.Column(sa.INTEGER, nullable=True)
