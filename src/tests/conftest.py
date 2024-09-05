# conftest.py
import asyncio
import os
from typing import Iterator

import pytest_asyncio

from httpx import AsyncClient
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

import pytest

from app import create_app
from database.orm import BaseModel
from database.models import Professions, Instructions, Rules, Divisions, User
from dependencies import get_db_session
from scripts.create_user import create_user
import settings
from web.instructions import services
from web.journals import services as journal_services

async_engine = create_async_engine(
    url='postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/test_control',
    echo=True,
)

test_session = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

app = create_app()

TEST_DIVISIONS = [
    {'title': 'sklad N1', 'description': 'Division 1'},
    {'title': 'sklad N2', 'description': 'Division 2'},
    {'title': 'direction', 'description': 'Division 3'},
]

TEST_PROFESSIONS = [
    {'title': 'engineer', 'description': 'Makes the world better'},
    {'title': 'developer', 'description': 'The head of the code'},
    {'title': 'delivery-manager', 'description': 'Makes tasks'},
    {'title': 'director', 'description': 'Makes decisions'},
    {'title': 'profession_to_delete', 'description': 'To delete'},
]

TEST_INSTRUCTIONS = [
    {
        'title': 'instruction-1',
        'number': 'N 1',
        'filename': 'instruction-1.pdf',
        'iteration': True,
        'period': 7,
    },
    {
        'title': 'instruction-2',
        'number': 'N 2',
        'filename': 'instruction-2.pdf',
        'iteration': False,
        'period': 0,
    },
    {
        'title': 'instruction-3',
        'number': 'N 3',
        'filename': 'instruction-3.pdf',
        'iteration': True,
        'period': 14,
    },
    {
        'title': 'instruction-4',
        'number': 'N 4',
        'filename': 'instruction-4.pdf',
        'iteration': False,
        'period': 0,
    },
]

TEST_RULES = [
    (TEST_PROFESSIONS[0]['title'], TEST_INSTRUCTIONS[0]['title']),
    (TEST_PROFESSIONS[0]['title'], TEST_INSTRUCTIONS[1]['title']),
    (TEST_PROFESSIONS[0]['title'], TEST_INSTRUCTIONS[2]['title']),
    (TEST_PROFESSIONS[1]['title'], TEST_INSTRUCTIONS[3]['title']),
    (TEST_PROFESSIONS[1]['title'], TEST_INSTRUCTIONS[1]['title']),
    (TEST_PROFESSIONS[2]['title'], TEST_INSTRUCTIONS[0]['title']),
    (TEST_PROFESSIONS[3]['title'], TEST_INSTRUCTIONS[3]['title']),
    (TEST_PROFESSIONS[4]['title'], TEST_INSTRUCTIONS[0]['title']),
    (TEST_PROFESSIONS[4]['title'], TEST_INSTRUCTIONS[1]['title']),
]

TEST_USERS = [
    {
        'email': 'user1@example.com',
        'password': '111111',
        'name': 'Vlasov',
        'last_name': 'Alex',
        'father_name': 'Valerievich',
        'telegram_id': '111111',
        'phone_number': '+380123456789',
    },
    {
        'email': 'user2@example.com',
        'password': '222222',
        'name': 'Ryabishkin',
        'last_name': 'Andrey',
        'father_name': 'Vladimirovich',
        'telegram_id': '222222',
        'phone_number': '+37055544433',
    },
    {
        'email': 'user3@example.com',
        'password': '333333',
        'name': 'Alexandr',
        'last_name': 'Bihalenko',
        'father_name': 'Xerznaetovich',
        'telegram_id': '333333',
        'phone_number': '+36055544433',
    },
    {
        'email': 'user4@example.com',
        'password': '111111',
        'name': 'Jura',
        'last_name': 'Koptev',
        'father_name': 'Viktorovich',
        'telegram_id': '444444',
        'phone_number': '+35055544433',
    },
    {
        'email': 'user5@example.com',
        'password': '555555',
        'name': 'Andrey',
        'last_name': 'Rubcov',
        'father_name': 'Sergeevich',
        'telegram_id': '555555',
        'phone_number': '+34055544433',
    }
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


@pytest.fixture(scope='session')
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
    return AsyncClient(app=app, base_url='http://test')


@pytest.mark.asyncio
async def test_ping(async_client):
    response = await async_client.get('/ping/')
    assert response.status_code == 200
    assert response.text == 'pong'


@pytest_asyncio.fixture
async def superuser(async_db_session):
    superuser = await create_user(
        async_db_session,
        email='admin@gmail.com',
        password='111111',
        name='John',
        last_name='Doe',
    )
    yield superuser


@pytest_asyncio.fixture
async def superuser_token(async_client, superuser):
    response_jwt = await async_client.post(
        '/api/v1/auth/jwt/login',
        data={'username': 'admin@gmail.com', 'password': '111111'},
    )
    yield response_jwt.json()['access_token']


@pytest.fixture
def test_instructions_dir(monkeypatch):
    test_value = os.path.join(
        settings.BASE_DIR, 'tests', 'static', 'instructions'
    )
    monkeypatch.setattr(services, 'INSTRUCTIONS_DIR', test_value)
    yield test_value


async def clean_db(async_db_session, test_instructions_dir):
    query = delete(Professions)
    await async_db_session.execute(query)
    query = delete(Instructions)
    await async_db_session.execute(query)
    query_del_rules = delete(Rules)
    await async_db_session.execute(query_del_rules)
    query_del_rules = delete(Divisions)
    await async_db_session.execute(query_del_rules)
    query_del_users = delete(User)
    await async_db_session.execute(query_del_users)
    await async_db_session.commit()
    for filename in os.listdir(test_instructions_dir):
        try:
            os.remove(os.path.join(test_instructions_dir, filename))
        except Exception:
            pass


@pytest_asyncio.fixture
async def teardown_db(async_db_session, test_instructions_dir):
    await clean_db(async_db_session, test_instructions_dir)
    yield
    await clean_db(async_db_session, test_instructions_dir)


@pytest_asyncio.fixture
async def create_professions(async_client, superuser_token):
    for profession in TEST_PROFESSIONS:
        response = await async_client.post(
            '/api/v1/professions/',
            json=profession,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 201
        profession_from_api = response.json()
        assert profession_from_api['title'] == profession['title']
        assert profession_from_api['description'] == profession['description']


@pytest_asyncio.fixture
async def create_instructions(async_client, superuser_token):
    for instruction in TEST_INSTRUCTIONS:
        file = os.path.join(
            settings.BASE_DIR,
            'tests',
            'files',
            'instructions',
            instruction['filename'],
        )
        files = {'file': open(file, 'rb')}
        response = await async_client.post(
            '/api/v1/instructions/',
            files=files,
            data={
                'title': instruction['title'],
                'number': instruction['number'],
                'iteration': instruction['iteration'],
                'period': instruction['period'],
            },
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 201
        instruction_from_api = response.json()
        assert instruction_from_api['title'] == instruction['title']
        assert instruction_from_api['number'] == instruction['number']
        assert instruction_from_api['iteration'] == instruction['iteration']
        assert instruction_from_api['period'] == instruction['period']


@pytest_asyncio.fixture
async def create_rules(async_client, superuser_token, async_db_session):
    query = select(Professions)
    professions = (await async_db_session.scalars(query)).all()
    query = select(Instructions)
    instructions = (await async_db_session.scalars(query)).all()

    for rule in TEST_RULES:
        prof = [prof for prof in professions if prof.title == rule[0]][0]
        ins = [ins for ins in instructions if ins.title == rule[1]][0]
        response = await async_client.post(
            '/api/v1/rules/',
            json={
                'profession_id': prof.id,
                'instruction_id': ins.id,
                'description': f'Test rule {prof.id} -- {ins.id}',
            },
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 201
        rule = response.json()
        assert rule['profession_id'] == prof.id
        assert rule['instruction_id'] == ins.id
        assert rule['description'] == f'Test rule {prof.id} -- {ins.id}'


@pytest_asyncio.fixture
async def create_divisions(async_client, superuser_token):
    for division in TEST_DIVISIONS:
        response = await async_client.post(
            '/api/v1/divisions/',
            json=division,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 201
        division_from_api = response.json()
        assert division_from_api['title'] == division['title']
        assert division_from_api['description'] == division['description']


@pytest.fixture
def get_test_session(monkeypatch):
    monkeypatch.setattr(journal_services, 'Session', test_session)
    yield test_session

@pytest_asyncio.fixture
async def setup(
    teardown_db,
    async_client,
    superuser_token,
    async_db_session,
    test_instructions_dir,
    create_professions,
    create_instructions,
    create_rules,
    create_divisions,
    get_test_session
):
    professions = (await async_db_session.scalars(select(Professions))).all()
    divisions = (await async_db_session.scalars(select(Divisions))).all()

    engeener_id = [prof.id for prof in professions if prof.title == 'engineer'][0]
    developer_id = [prof.id for prof in professions if prof.title == 'developer'][0]
    delivery_manager_id = [prof.id for prof in professions if prof.title == 'delivery-manager'][0]
    director_id = [prof.id for prof in professions if prof.title == 'director'][0]
    profession_to_delete_id = [prof.id for prof in professions if prof.title == 'profession_to_delete'][0]

    division1_id = [div.id for div in divisions if div.title == 'sklad N1'][0]
    division2_id = [div.id for div in divisions if div.title == 'sklad N2'][0]
    division3_id = [div.id for div in divisions if div.title == 'direction'][0]

    user1 = TEST_USERS[0]
    user2 = TEST_USERS[1]
    user3 = TEST_USERS[2]
    user4 = TEST_USERS[3]
    user5 = TEST_USERS[4]

    user1.update({'profession_id': engeener_id, 'division_id': division1_id})
    user2.update({'profession_id': developer_id, 'division_id': division1_id})
    user3.update({'profession_id': delivery_manager_id, 'division_id': division2_id})
    user4.update({'profession_id': director_id, 'division_id': division3_id})
    user5.update({'profession_id': profession_to_delete_id, 'division_id': division3_id})

    for user in [user1, user2, user3, user4, user5]:
        response = await async_client.post(
            '/api/v1/auth/register',
            json=user,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 201
        user_from_api = response.json()
        assert user_from_api['email'] == user['email']
        assert user_from_api['name'] == user['name']
        assert user_from_api['last_name'] == user['last_name']
        assert user_from_api['father_name'] == user['father_name']
        assert user_from_api['telegram_id'] == user['telegram_id']
        assert user_from_api['phone_number'] == user['phone_number']

    yield
