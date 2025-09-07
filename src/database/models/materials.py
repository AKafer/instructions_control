import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class Materials(BaseModel):
    __tablename__ = 'materials'

    id = sa.Column(sa.BigInteger, primary_key=True)
    user_id = sa.Column(
        sa.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False
    )
    material_type_id = sa.Column(
        sa.ForeignKey("material_types.id", ondelete="CASCADE"),
        nullable=False
    )

    sertificate = sa.Column(sa.String(320), nullable=True)
    start_date = sa.Column(sa.Date(), nullable=True)
    period = sa.Column(sa.Integer, nullable=True)
    number_of_document = sa.Column(sa.String(320), nullable=True)
    quantity = sa.Column(sa.Integer, nullable=True)

    user = relationship(
        "User",
        back_populates="materials",
        lazy='selectin',
        passive_deletes=True
    )

    material_type = relationship(
        "MaterialTypes",
        back_populates="materials",
        lazy='selectin',
        passive_deletes = True
    )