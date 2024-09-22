import pytest
import pytest_asyncio
from sqlalchemy import select

from database.models import User, Professions
from scripts.create_user import create_user
from tests.conftest import async_db_session



@pytest.mark.asyncio
async def test_create_superuser(async_db_session, superuser):
    query = select(User).where(User.email == "admin@gmail.com")
    superuser_db = await async_db_session.scalar(query)
    assert superuser_db.email == "admin@gmail.com"
    assert superuser_db.is_superuser == True
    assert superuser_db.name == "John"
    assert superuser_db.last_name == "Doe"

@pytest.mark.asyncio
async def test_get_superuser_token(superuser_token):
    assert type(superuser_token) == str




@pytest.mark.asyncio
async def test_create_get_user(setup, async_client, superuser_token, get_test_session_in_user_services):
    profession_payload = {
        "title": "president",
        "description": "The head of the state",
    }

    response = await async_client.post(
        "/api/v1/professions/",
        json=profession_payload,
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    profession = response.json()
    assert response.status_code == 201
    assert profession["title"] == "president"
    assert profession["description"] == "The head of the state"


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
        "profession_id": profession['id'],
        "division_id": 1,
    }
    response = await async_client.post(
        "/api/v1/auth/register",
        json=user_payload,
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    user = response.json()
    assert response.status_code == 201
    assert  user["email"] == "zelen@example.com"
    assert  user["name"] == "Volodimir"
    assert  user["last_name"] == "Zelenskiy"
    assert  user["father_name"] == "Alexandrovich"
    assert  user["telegram_id"] == "80989888"
    assert  user["phone_number"] == "+380987654321"
    assert  user["profession"] == {'id': profession['id'], 'title': 'president'}

