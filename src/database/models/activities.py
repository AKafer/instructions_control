import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class Activities(BaseModel):
    __tablename__ = 'activities'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False, unique=True)
    description = sa.Column(sa.Text(), nullable=True)

    users = relationship(
        "User",
        back_populates="activity",
    )
    norm = relationship(
        "Norms",
        cascade="all, delete, delete-orphan",
        single_parent=True,
        back_populates="activity",
    )
