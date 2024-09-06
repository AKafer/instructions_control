import re
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, String, func, case
from sqlalchemy.ext.hybrid import hybrid_property

from database.models import Instructions
from database.orm import BaseModel


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
    signature = sa.Column(String(length=320), nullable=True)

    sa.UniqueConstraint('user_uuid', 'instruction_id', name='uix_2')

    instruction = sa.orm.relationship('Instructions', back_populates='journals', lazy='selectin')

    # def __setattr__(self, key, value):
    #     pattern = r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}--\d+--\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\w+$"
    #     if key == 'signature' and not re.match(pattern, value):
    #         print(f"Value {value} is not match pattern and not updated")
    #     else:
    #         super().__setattr__(key, value)

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
        # Подключение к связанной таблице через instruction
        return case(
            # Если last_date_read is NULL, то False
            (cls.last_date_read == None, False),

            # Если iteration == True и разница в днях превышает период
            (
                cls.instruction.has(
                    (Instructions.iteration == True) &
                    (
                            func.date_part('day', func.now() - cls.last_date_read) > Instructions.period
                    )
                ),
                False
            ),
            else_=True  # В противном случае True
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
        # SQL выражение для вычисления оставшихся дней
        return case(
            # Если last_date_read == NULL, то вернуть 0
            (cls.last_date_read == None, 0),

            # Если iteration == True и разница в днях больше чем период
            (
                cls.instruction.has(
                    (Instructions.iteration == True) &
                    (
                            func.date_part('day', func.now() - cls.last_date_read) > Instructions.period
                    )
                ),
                0
            ),

            # Если iteration == True, вычислить оставшиеся дни
            (
                cls.instruction.has(Instructions.iteration == True),
                Instructions.period - func.date_part('day', func.now() - cls.last_date_read)
            ),

            # Если iteration == False, вернуть 0
            else_=0
        )

