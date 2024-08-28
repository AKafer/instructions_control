
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool

from database.orm import BaseModel

SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/test_control"
# SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

async_engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL
)
# TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

TestSession = async_sessionmaker(
    autocommit=False,
    expire_on_commit=False,
    class_=AsyncSession,
    bind=async_engine
)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()
