# conftest.py
import asyncio
import glob
import os
from typing import Iterator

import pytest_asyncio
from fastapi import FastAPI
from fastapi_pagination import add_pagination
from httpx import AsyncClient
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

import pytest
from starlette.staticfiles import StaticFiles

from app import setup_routes, create_app
from database.orm import BaseModel
from database.models import Professions, Instructions, Rules
from dependencies import get_db_session
from scripts.create_user import create_user
import settings
from web.instructions import services

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
        "number": 'N 1',
        "filename": "instruction-1.pdf",
        "iteration": True,
        "period": 7,
    },
    {
        "title": "instruction-2",
        "number": 'N 2',
        "filename": "instruction-2.pdf",
        "iteration": False,
        "period": 0,
    },
    {
        "title": "instruction-3",
        "number": 'N 3',
        "filename": "instruction-3.pdf",
        "iteration": True,
        "period": 14,
    },
    {
        "title": "instruction-4",
        "number": 'N 4',
        "filename": "instruction-4.pdf",
        "iteration": False,
        "period": 0,
    },
]

TEST_RULES=[
    {TEST_PROFESSIONS[0]["title"]: TEST_INSTRUCTIONS[0]["title"]},
    {TEST_PROFESSIONS[0]["title"]: TEST_INSTRUCTIONS[1]["title"]},
    {TEST_PROFESSIONS[0]["title"]: TEST_INSTRUCTIONS[2]["title"]},
    {TEST_PROFESSIONS[1]["title"]: TEST_INSTRUCTIONS[0]["title"]},
    {TEST_PROFESSIONS[1]["title"]: TEST_INSTRUCTIONS[1]["title"]},
    {TEST_PROFESSIONS[2]["title"]: TEST_INSTRUCTIONS[0]["title"]},
]

@pytest_asyncio.fixture(name='async_db_session')
async def async_db_session(event_loop) -> AsyncSession:
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
async def superuser(async_db_session):
    superuser = await create_user(
        async_db_session,
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


@pytest.fixture
def test_instructions_dir(monkeypatch):
    test_value = os.path.join(settings.BASE_DIR, "tests", "static", "instructions")
    monkeypatch.setattr(services, "INSTRUCTIONS_DIR", test_value)
    yield test_value



@pytest_asyncio.fixture
async def setup(async_client, superuser_token, async_db_session, test_instructions_dir):
    query = delete(Professions)
    await async_db_session.execute(query)
    query = delete(Instructions)
    await async_db_session.execute(query)
    query_del_rules = delete(Rules)
    await async_db_session.execute(query_del_rules)
    await async_db_session.commit()
    for filename in os.listdir(test_instructions_dir):
        try:
            os.remove(os.path.join(test_instructions_dir, filename))
        except Exception:
            pass

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
        file = os.path.join(settings.BASE_DIR, "tests", "files", "instructions", instruction["filename"])
        files = {"file": open(file, "rb")}
        response = await async_client.post(
            "/api/v1/instructions/",
            files=files,
            data={
                "title": instruction["title"],
                "number": instruction["number"],
                "iteration": instruction["iteration"],
                "period": instruction["period"],
            },
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        assert response.status_code == 201
        instruction_from_api = response.json()
        assert instruction_from_api["title"] == instruction["title"]
        assert instruction_from_api["number"] == instruction["number"]
        assert instruction_from_api["iteration"] == instruction["iteration"]
        assert instruction_from_api["period"] == instruction["period"]

    query = select(Professions)
    professions = (await async_db_session.scalars(query)).all()
    query = select(Instructions)
    instructions = (await async_db_session.scalars(query)).all()

    for rules in TEST_RULES:
        for prof_title, ins_title in rules.items():
            prof = [prof for prof in professions if prof.title == prof_title][0]
            ins = [ins for ins in instructions if ins.title == ins_title][0]
            response = await async_client.post(
                "/api/v1/rules/",
                json={
                    "profession_id": prof.id,
                    "instruction_id": ins.id,
                    "description": f"Test rule {prof.id} -- {ins.id}",
                },
                headers={"Authorization": f"Bearer {superuser_token}"}
            )
            assert response.status_code == 201
            rule = response.json()
            assert rule["profession_id"] == prof.id
            assert rule["instruction_id"] == ins.id

    yield

    query_del_prof = delete(Professions)
    await async_db_session.execute(query_del_prof)
    query_del_ins = delete(Instructions)
    await async_db_session.execute(query_del_ins)
    query_del_rules = delete(Rules)
    await async_db_session.execute(query_del_rules)

    await async_db_session.commit()
    for filename in os.listdir(test_instructions_dir):
        try:
            os.remove(os.path.join(test_instructions_dir, filename))
        except Exception:
            pass
