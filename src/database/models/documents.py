import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class Documents(BaseModel):
    __tablename__ = 'documents'

    id = sa.Column(sa.BigInteger, primary_key=True)
    user_id = sa.Column(
        sa.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False
    )
    document_type_id = sa.Column(
        sa.ForeignKey("document_types.id", ondelete="CASCADE"),
        nullable=False
    )
    start_date = sa.Column(sa.Date, nullable=True)


    user = relationship(
        "User",
        back_populates="documents",
        lazy='selectin',
        passive_deletes=True
    )

    document_type = relationship(
        "DocumentTypes",
        back_populates="documents",
        lazy='selectin',
        passive_deletes = True
    )