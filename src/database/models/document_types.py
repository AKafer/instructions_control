import sqlalchemy as sa

from database.orm import BaseModel


class DocumentTypes(BaseModel):
    __tablename__ = 'document_types'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False)
    description = sa.Column(sa.Text(), nullable=True)
    period = sa.Column(sa.Integer, nullable=True)

    documents = sa.orm.relationship(
        'Documents',
        back_populates='document_type',
        lazy='selectin',
        cascade="all, delete, delete-orphan",
        single_parent=True,
    )
