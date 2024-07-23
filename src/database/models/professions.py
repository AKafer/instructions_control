import sqlalchemy as sa
from database.orm import BaseModel


class Profession(BaseModel):
    __tablename__ = 'professions'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False)
    description = sa.Column(sa.Text(), nullable=True)
