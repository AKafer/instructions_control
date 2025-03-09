from fastapi import Depends

from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy import String, Boolean, ForeignKey, JSON
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
    number: Mapped[str] = mapped_column(String(length=320), nullable=True)
    inn: Mapped[str] = mapped_column(String(length=320), nullable=True, unique=True)
    snils: Mapped[str] = mapped_column(String(length=320), nullable=True, unique=True)
    date_of_birth: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=True)
    started_work: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=True)
    changed_profession: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=True)
    additional_features: Mapped[dict] = mapped_column(JSON, nullable=True, server_default='{}')

    instructions = relationship(
        "Instructions",
        secondary='journals',
        back_populates="users",
        lazy='selectin',
    )
    profession = relationship(
        "Professions",
        back_populates="users",
        lazy='selectin',
    )
    division = relationship(
        "Divisions",
        back_populates="users",
        lazy='selectin',
    )
    histories = relationship(
        "Histories",
        back_populates="user",
        lazy='selectin',
    )
    journals = relationship(
        "Journals",
        back_populates="user",
        lazy='selectin',
        cascade="all, delete, delete-orphan",
        single_parent=True,
    )
    activities = relationship(
        "Activities",
        back_populates="users",
        lazy='selectin',
        secondary='activity_registry',
    )
    materials = relationship(
        "Materials",
        back_populates="user",
        lazy='selectin',
        cascade="all, delete, delete-orphan",
        single_parent=True,
    )
    documents = relationship(
        "Documents",
        back_populates="user",
        lazy='selectin',
        cascade="all, delete, delete-orphan",
        single_parent=True,
    )


async def get_user_db(session: AsyncSession = Depends(get_db_session)):
    yield SQLAlchemyUserDatabase(session, User)
