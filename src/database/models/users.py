from datetime import datetime

from fastapi import Depends


from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy import String, Boolean, ForeignKey, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import DateTime

from database.orm import BaseModel
from dependencies import get_db_session


class utcnow(expression.FunctionElement):
    type = DateTime()
    inherit_cache = True


@compiles(utcnow, 'postgresql')
def pg_utcnow(element, compiler, **kw):
    return "TIMEZONE('utc', CURRENT_TIMESTAMP)"


class User(SQLAlchemyBaseUserTableUUID, BaseModel):
    email: Mapped[str] = mapped_column(
        String(length=320), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(
        String(length=1024), nullable=False
    )
    name: Mapped[str] = mapped_column(String(length=320), nullable=False)
    last_name: Mapped[str] = mapped_column(String(length=320), nullable=False)
    father_name: Mapped[str] = mapped_column(String(length=320), nullable=True)
    telegram_id: Mapped[str] = mapped_column(String(length=320), nullable=True)
    phone_number: Mapped[str] = mapped_column(String(length=320), nullable=True)
    profession_id: Mapped[str] = mapped_column(ForeignKey("professions.id", ondelete='SET NULL'), nullable=True)
    division_id: Mapped[str] = mapped_column(ForeignKey("divisions.id", ondelete='SET NULL'), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=utcnow(), nullable=False)
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), onupdate=utcnow(), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    instructions = relationship(
        "Instructions",
        secondary='journals',
        back_populates="users",
        lazy='selectin'
    )

    profession = relationship(
        "Professions",
        back_populates="users",
        lazy='selectin'
    )

    division = relationship(
        "Divisions",
        back_populates="users",
        lazy='selectin'
    )


async def get_user_db(session: AsyncSession = Depends(get_db_session)):
    yield SQLAlchemyUserDatabase(session, User)
