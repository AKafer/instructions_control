import pytest
import pytest_asyncio
from sqlalchemy import select

from database.models import User, Professions
from scripts.create_user import create_user
from tests.conftest import async_db

@pytest.mark.asyncio
async def test_ping(async_client):
    response = await async_client.get("/ping/")
    assert response.status_code == 200
    assert response.text == "pong"

@pytest_asyncio.fixture
async def profession(async_db):
    profession_payload = {
        "title": "president",
        "description": "The head of the state",
    }

    prof = Professions(**profession_payload)
    async_db.add(prof)
    await async_db.commit()
    await async_db.refresh(prof)
    yield prof

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


@pytest.mark.asyncio
async def test_create_profession(async_db, profession):
    query = select(Professions).where(Professions.id == profession.id)
    profession = await async_db.scalar(query)
    assert profession.title == "president"
    assert profession.description == "The head of the state"

@pytest.mark.asyncio
async def test_create_superuser(async_db, superuser):
    query = select(User).where(User.email == "admin@gmail.com")
    superuser_db = await async_db.scalar(query)
    assert superuser_db.email == "admin@gmail.com"
    assert superuser_db.is_superuser == True
    assert superuser_db.name == "John"
    assert superuser_db.last_name == "Doe"


@pytest.mark.asyncio
async def test_create_get_user(async_client, async_db, profession, superuser):


    response_jwt = await async_client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "admin@gmail.com", "password": "111111"}
    )

    token = response_jwt.json()["access_token"]

    user_payload = {
        "email": "zelen@example.com",
        "password": "111111",
        "is_active": True,
        "is_superuser": False,
        "is_verified": False,
        "name": "Volodimir",
        "last_name": "Zelenskiy",
        "father_name": "Alexandrovich",
        "telegram_id": "80989888",
        "phone_number": "+380987654321",
        "profession_id": profession.id,
    }
    response = await async_client.post(
        "/api/v1/auth/register",
        json=user_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    assert response.json()["email"] == "zelen@example.com"
