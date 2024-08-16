import sqlalchemy as sa
from sqlalchemy import DateTime, String

from database.models.users import utcnow
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
    last_date_read = sa.Column(DateTime(timezone=True), server_default=utcnow(), nullable=False)
    signature = sa.Column(String(length=320), nullable=True)

    sa.UniqueConstraint('user_uuid', 'instruction_id', name='uix_2')
