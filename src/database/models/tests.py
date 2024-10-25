import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class Templates(BaseModel):
    __tablename__ = 'templates'

    id = sa.Column(sa.BigInteger, primary_key=True)
    content = sa.Column(sa.JSON, nullable=True)

class Answers(BaseModel):
    __tablename__ = 'answers'

    id = sa.Column(sa.BigInteger, primary_key=True)
    question = sa.Column(sa.Text(), nullable=False)
    answers = sa.Column(sa.JSON, nullable=False)
    correct_answer = sa.Column(sa.Integer, nullable=False)
    test_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey("tests.id", ondelete="CASCADE"),
        nullable=False,
    )
    test = relationship(
        "Tests",
        back_populates="answers",
        lazy='selectin',
    )

class Tests(BaseModel):
    __tablename__ = 'tests'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False, unique=True)
    description = sa.Column(sa.Text(), nullable=True)
    success_rate = sa.Column(sa.Integer, nullable=False)
    instruction_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey("instructions.id", ondelete="CASCADE"),
        nullable=False,
    )
    instruction = relationship(
        "Instructions",
        back_populates="tests",
        lazy='selectin',
    )
    answers = relationship(
        "Answers",
        lazy='selectin',
    )
