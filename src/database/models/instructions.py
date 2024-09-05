import re

import sqlalchemy as sa
from sqlalchemy import event
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
        lazy='selectin'
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


    # def __setattr__(self, key, value):
    #     pattern = r"^\d+--\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\w+$"
    #     if type(value) == str:
    #         if key == 'filename' and not re.match(pattern, value):
    #             print(f"Value {value} is not match pattern and not updated")
    #             return
    #         else:
    #             super().__setattr__(key, value)
    #     else:
    #         super().__setattr__(key, value)
