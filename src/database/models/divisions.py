import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class Divisions(BaseModel):
    __tablename__ = 'divisions'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False, unique=True)
    description = sa.Column(sa.Text(), nullable=True)


    users = relationship(
        "User",
        back_populates="division",
    )