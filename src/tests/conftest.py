# conftest.py
import asyncio
from typing import Iterator

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

import pytest
from sqlalchemy.orm import declarative_base

from app import create_app
from database.orm import BaseModel
from database.models import User, Professions
from dependencies import get_db_session

async_engine = create_async_engine(
    url="postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/test_control",
    echo=True,
)

test_session = async_sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


app = create_app()


# async def override_get_db():
#     async with test_session() as session:
#         try:
#             yield session
#         finally:
#             await session.rollback()
#             await session.close()

# truncate all table to isolate tests
@pytest_asyncio.fixture(name='async_db')
async def async_db(event_loop) -> AsyncSession:
    async with async_engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.drop_all)
        await conn.run_sync(BaseModel.metadata.create_all)
    async with test_session() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()





@pytest_asyncio.fixture(name='async_client')
async def async_client() -> AsyncClient:

    async def override_get_db() -> Iterator[AsyncSession]:
        async with test_session() as session:
            try:
                yield session
            finally:
                await session.rollback()
                await session.close()

    app.dependency_overrides[get_db_session] = override_get_db
    return AsyncClient(app=app, base_url="http://test")