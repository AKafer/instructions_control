import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class Professions(BaseModel):
    __tablename__ = 'professions'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False, unique=True)
    description = sa.Column(sa.Text(), nullable=True)

    instructions = relationship(
        "Instructions",
        secondary='rules',
        back_populates="professions",
        lazy='selectin'
    )

    users = relationship(
        "User",
        back_populates="profession",
    )
