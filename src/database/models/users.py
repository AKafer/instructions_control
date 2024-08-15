from fastapi import Depends


from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from database.orm import BaseModel
from dependencies import get_db_session


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
    profession: Mapped[str] = mapped_column(ForeignKey("professions.id", ondelete='SET NULL'), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


async def get_user_db(session: AsyncSession = Depends(get_db_session)):
    yield SQLAlchemyUserDatabase(session, User)
