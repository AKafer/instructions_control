import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class Activities(BaseModel):
    __tablename__ = 'activities'

    id = sa.Column(sa.BigInteger, primary_key=True)
    title = sa.Column(sa.String(64), nullable=False, unique=True)
    description = sa.Column(sa.Text(), nullable=True)

    users = relationship(
        "User",
        secondary='activity_registry',
        back_populates="activities",
        lazy='selectin'
    )

    norm = relationship(
        "Norms",
        cascade="all, delete, delete-orphan",
        single_parent=True,
        back_populates="activity",
    )


class ActivityRegistry(BaseModel):
    __tablename__ = 'activity_registry'

    id = sa.Column(sa.BigInteger, primary_key=True)
    activity_id = sa.Column(
        sa.ForeignKey("activities.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = sa.Column(
        sa.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )

    sa.UniqueConstraint('activity_id', 'user_id', name='uix_3')


