from sqlalchemy import DateTime, String

from database.orm import BaseModel
import sqlalchemy as sa

class Histories(BaseModel):
    __tablename__ = 'histories'

    id = sa.Column(sa.BigInteger, primary_key=True)
    user_uuid = sa.Column(
        sa.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False
    )
    journal_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey("journals.id", ondelete="CASCADE"),
        nullable=False,
    )
    date = sa.Column(DateTime(timezone=True), nullable=False)
    signature = sa.Column(String(length=320), nullable=True)
    instruction_title = sa.Column(String(length=640), nullable=True)

    journal = sa.orm.relationship('Journals', lazy='selectin')
    user = sa.orm.relationship('User', lazy='selectin')