import sqlalchemy as sa
from sqlalchemy.orm import relationship

from database.orm import BaseModel


class TrainingModules(BaseModel):
    __tablename__ = 'training_modules'

    id = sa.Column(sa.BigInteger, primary_key=True, autoincrement=True)
    instruction_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey("instructions.id", ondelete='CASCADE'),
        nullable=False
    )
    title = sa.Column(sa.String(640), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    order_index = sa.Column(sa.Integer, nullable=False, default=1)
    filename = sa.Column(sa.String(640), nullable=True)

    instruction = relationship(
        "Instructions",
        back_populates="training_modules",
        lazy='selectin',
    )
    module_progresses = relationship(
        "TrainingModuleProgresses",
        back_populates="module",
        lazy='selectin',
        cascade="all, delete, delete-orphan",
        single_parent=True,
    )

class TrainingModuleProgresses(BaseModel):
    __tablename__ = 'training_module_progresses'

    id = sa.Column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id = sa.Column(
        sa.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False
    )
    module_id = sa.Column(
        sa.BigInteger,
        sa.ForeignKey("training_modules.id", ondelete='CASCADE'),
        nullable=False
    )
    is_completed = sa.Column(sa.Boolean, default=False, nullable=False)
    completed_at = sa.Column(sa.DateTime(timezone=True), nullable=True)

    user = relationship(
        "User",
        back_populates="module_progresses",
        lazy='selectin',
        passive_deletes=True
    )
    module = relationship(
        "TrainingModules",
        back_populates="module_progresses",
        lazy='selectin',
        passive_deletes=True
    )
