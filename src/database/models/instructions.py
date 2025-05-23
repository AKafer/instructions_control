import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel, Session


class Instructions(BaseModel):
    __tablename__ = 'instructions'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(640), nullable=False, unique=True)
    number = sa.Column(sa.String(320), nullable=True)
    filename = sa.Column(sa.String(640), nullable=True)
    iteration = sa.Column(sa.Boolean(), nullable=False, default=False)
    period = sa.Column(sa.INTEGER, nullable=True)

    journals = sa.orm.relationship(
        'Journals',
        lazy='selectin',
        cascade = "all, delete, delete-orphan",
        single_parent = True,
    )

    users = relationship(
        "User",
        secondary='journals',
        back_populates="instructions"
    )

    professions = relationship(
        "Professions",
        secondary='rules',
        back_populates="instructions",
    )

    tests = relationship(
        "Tests",
        lazy='selectin',
        cascade="all, delete, delete-orphan",
        single_parent=True,
    )
    training_modules = relationship(
        "TrainingModules",
        back_populates="instruction",
        lazy='selectin',
        cascade="all, delete, delete-orphan",
        single_parent=True,
    )
