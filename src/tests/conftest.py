# conftest.py
import asyncio
import os
from typing import Iterator

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

import pytest
from sqlalchemy.orm import declarative_base

from app import create_app
from database.orm import BaseModel
from database.models import User, Professions
from dependencies import get_db_session
from scripts.create_user import create_user
from settings import BASE_DIR

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

TEST_PROFESSIONS = [
    {"title": "engineer", "description": "Makes the world better"},
    {"title": "developer", "description": "The head of the code"},
    {"title": "delivery-manager", "description": "Makes tasks"},
    {"title": "director", "description": "Makes decisions"},
    {"title": "profession_to_delete", "description": "To delete"},
]

TEST_INSTRUCTIONS = [
    {
        "title": "instruction-1",
        "number": 1,
        "filename": "instruction-1.pdf",
        "iteration": True,
        "period": 7,
    },
    {
        "title": "instruction-2",
        "number": 2,
        "filename": "instruction-2.pdf",
        "iteration": False,
        "period": 0,
    },
    {
        "title": "instruction-3",
        "number": 3,
        "filename": "instruction-3.pdf",
        "iteration": True,
        "period": 14,
    },
    {
        "title": "instruction-4",
        "number": 4,
        "filename": "instruction-4.pdf",
        "iteration": False,
        "period": 0,
    },
]




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


@pytest.mark.asyncio
async def test_ping(async_client):
    response = await async_client.get("/ping/")
    assert response.status_code == 200
    assert response.text == "pong"


@pytest_asyncio.fixture
async def superuser(async_db):
    superuser = await create_user(
        async_db,
        email="admin@gmail.com",
        password="111111",
        name="John",
        last_name="Doe",
    )
    yield superuser


@pytest_asyncio.fixture
async def superuser_token(async_client, superuser):
    response_jwt = await async_client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "admin@gmail.com", "password": "111111"}
    )
    yield response_jwt.json()["access_token"]


@pytest_asyncio.fixture
async def setup(async_client, superuser_token, async_db):
    for profession in TEST_PROFESSIONS:
        response = await async_client.post(
            "/api/v1/professions/",
            json=profession,
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        assert response.status_code == 201
        profession_from_api = response.json()
        assert profession_from_api["title"] == profession["title"]
        assert profession_from_api["description"] == profession["description"]

    for instruction in TEST_INSTRUCTIONS:
        # https://stackoverflow.com/questions/74716617/how-to-test-file-upload-in-pytest
        # https://blog.entirely.digital/flask-pytest-testing-uploads/
        with open(, "rb") as f:
            file_data = ContentFile(f.read(), )
            response = await async_client.post(
                "/api/v1/instructions/",
                data={
                    "title": instruction["title"],
                    "number": instruction["number"],
                    "file": file,
                    "iteration": instruction["iteration"],
                    "period": instruction["period"],
                },
                headers={"Authorization": f"Bearer {superuser_token}"}
            )
        assert response.status_code == 201
        instruction_from_api = response.json()
        assert instruction_from_api["title"] == instruction["title"]
        assert instruction_from_api["number"] == instruction["number"]
        assert instruction_from_api["filename"] == instruction["filename"]
        assert instruction_from_api["iteration"] == instruction["iteration"]
        assert instruction_from_api["period"] == instruction["period"]
    yield
    query = delete(Professions)
    await async_db.execute(query)




