from enum import Enum

from sqlalchemy import DateTime, String

from database.orm import BaseModel
import sqlalchemy as sa


class Histories(BaseModel):
    __tablename__ = 'histories'

    class Type(str, Enum):
        TEST_EXECUTION = 'TEST_EXECUTION'
        DATE_RENEWAL = 'DATE_RENEWAL'

    id = sa.Column(sa.BigInteger, primary_key=True)
    type = sa.Column(
        sa.Enum(Type, name='history_type_enum'),
        nullable=False,
        server_default=Type.DATE_RENEWAL,
    )
    user_uuid = sa.Column(
        sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=False
    )
    journal_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey('journals.id', ondelete='CASCADE'),
        nullable=False,
    )
    instruction_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey('instructions.id', ondelete='SET NULL'),
        nullable=True,
    )
    test_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey('tests.id', ondelete='SET NULL'),
        nullable=True,
    )
    date = sa.Column(DateTime(timezone=True), nullable=False)
    signature = sa.Column(String(length=320), nullable=True)
    additional_data = sa.Column(sa.JSON, nullable=True)

    journal = sa.orm.relationship(
        'Journals',
        lazy='selectin',
        passive_deletes=True
    )
    user = sa.orm.relationship(
        'User',
        lazy='selectin',
        passive_deletes=True
    )
    instruction = sa.orm.relationship(
        'Instructions',
        lazy='selectin',
        passive_deletes=True
    )
    test = sa.orm.relationship(
        'Tests',
        lazy='selectin',
        passive_deletes=True
    )
