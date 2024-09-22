from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, String, func, case, select, and_
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import column_property

from database.models import Instructions, Rules, User
from database.orm import BaseModel, Session


class Journals(BaseModel):
    __tablename__ = 'journals'

    id = sa.Column(sa.BigInteger, primary_key=True)
    user_uuid = sa.Column(
        sa.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False
    )
    instruction_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey("instructions.id", ondelete="CASCADE"),
        nullable=False,
    )
    last_date_read = sa.Column(DateTime(timezone=True), nullable=True)
    actual = sa.Column(sa.Boolean, default=True, nullable=False)
    signature = sa.Column(String(length=320), nullable=True)

    sa.UniqueConstraint('user_uuid', 'instruction_id', name='uix_2')

    instruction = sa.orm.relationship('Instructions', back_populates='journals', lazy='selectin')
    histories = sa.orm.relationship('Histories', back_populates='journal', lazy='selectin')


    @hybrid_property
    def valid(self):
        if self.last_date_read is None:
            return False

        if self.instruction.iteration:
            date_diff = (
                    datetime.utcnow().replace(tzinfo=None)
                    - self.last_date_read.replace(tzinfo=None)
            ).days
            if date_diff > self.instruction.period:
                return False
            else:
                return True
        else:
            return True

    @valid.expression
    def valid(cls):
        return case(
            (cls.last_date_read == None, False),
            (
                cls.instruction.has(
                    (Instructions.iteration == True) &
                    (
                            func.date_part('day', func.now() - cls.last_date_read) > Instructions.period
                    )
                ),
                False
            ),
            else_=True
        )


    @hybrid_property
    def remain_days(self):
        if self.last_date_read is None:
            return 0

        if self.instruction.iteration:
            date_diff = (
                    datetime.utcnow().replace(tzinfo=None)
                    - self.last_date_read.replace(tzinfo=None)
            ).days
            if date_diff > self.instruction.period:
                return 0
            else:
                return self.instruction.period - date_diff
        else:
            return 0

    @remain_days.expression
    def remain_days(cls):
        return case(
            (cls.last_date_read == None, 0),

            (
                cls.instruction.has(
                    (Instructions.iteration == True) &
                    (
                            func.date_part('day', func.now() - cls.last_date_read) > Instructions.period
                    )
                ),
                0
            ),
            (
                cls.instruction.has(Instructions.iteration == True),
                Instructions.period - func.date_part('day', func.now() - cls.last_date_read)
            ),
            else_=0
        )

