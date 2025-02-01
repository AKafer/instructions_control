
import sqlalchemy as sa
from sqlalchemy import CheckConstraint
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class Norms(BaseModel):
    __tablename__ = 'norms'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(320), nullable=False)
    profession_id = sa.Column(
        sa.ForeignKey("professions.id", ondelete="CASCADE"),
        unique=True
    )
    activity_id = sa.Column(
        sa.ForeignKey("activities.id", ondelete="CASCADE"),
        unique=True
    )

    profession = relationship(
        "Professions",
        back_populates="norm",
        uselist=False,
        lazy='selectin',
        passive_deletes=True
    )
    activity = relationship(
        "Activities",
        back_populates="norm",
        uselist=False,
        lazy='selectin',
        passive_deletes=True
    )
    material_norm_types = relationship(
        "NormMaterials",
        back_populates="norm",
        lazy='selectin',
        cascade = "all, delete, delete-orphan",
        single_parent = True,
    )


class NormMaterials(BaseModel):
    __tablename__ = 'norm_materials'

    id = sa.Column(sa.BigInteger, primary_key=True)
    norm_id = sa.Column(
        sa.ForeignKey("norms.id", ondelete="CASCADE"),
        nullable=False
    )
    material_type_id = sa.Column(
        sa.ForeignKey("material_types.id", ondelete="CASCADE"),
        nullable=False
    )
    quantity = sa.Column(sa.Float, nullable=True)
    period = sa.Column(sa.Integer, nullable=True)
    npa_link = sa.Column(sa.String(320), nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    norm = relationship("Norms", back_populates="material_norm_types")
    material_type = relationship(
        "MaterialTypes",
        back_populates="norms_materials",
        lazy='selectin',
        passive_deletes = True
    )
