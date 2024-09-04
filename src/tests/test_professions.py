import pytest
import pytest_asyncio
from sqlalchemy import select

from database.models import Professions
from tests.conftest import TEST_PROFESSIONS, TEST_RULES


@pytest_asyncio.fixture
async def get_test_profession_with_max_id(async_db_session):
    query = select(Professions).order_by(Professions.id.desc()).limit(1)
    profession = await async_db_session.scalar(query)
    return profession


class TestProfessions:
    @pytest.mark.asyncio
    async def test_get_profession(self, setup, async_client, superuser_token):
        response = await async_client.get(
            '/api/v1/professions/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        prosefions = response.json()
        assert response.status_code == 200
        assert len(prosefions) == len(TEST_PROFESSIONS)

    @pytest.mark.asyncio
    async def test_get_profession_by_id(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        get_test_profession_with_max_id,
    ):
        test_profession = get_test_profession_with_max_id

        response = await async_client.get(
            f'/api/v1/professions/{test_profession.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        profession = response.json()
        assert response.status_code == 200
        assert profession['id'] == test_profession.id
        assert profession['title'] == test_profession.title
        assert profession['description'] == test_profession.description

        response = await async_client.get(
            f'/api/v1/professions/{test_profession.id + 1}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 404
        assert (
            response.json()['detail']
            == f'Profession with id {test_profession.id + 1} not found'
        )

    @pytest.mark.asyncio
    async def test_update_profession(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        get_test_profession_with_max_id,
    ):
        test_profession = get_test_profession_with_max_id

        profession_payload = {
            'title': 'engineer_new',
            'description': 'Makes the world more better',
        }

        response = await async_client.patch(
            f'/api/v1/professions/{test_profession.id}',
            json=profession_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        profession = response.json()
        assert response.status_code == 200
        assert profession['title'] == profession_payload['title']
        assert profession['description'] == profession_payload['description']

    @pytest.mark.asyncio
    async def test_delete_profession(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        get_test_profession_with_max_id,
    ):
        response = await async_client.get(
            '/api/v1/rules/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rules_before_deletion = response.json()

        test_profession = get_test_profession_with_max_id
        response = await async_client.delete(
            f'/api/v1/professions/{test_profession.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 204
        query = select(Professions).where(Professions.id == test_profession.id)
        profession = await async_db_session.scalar(query)
        assert profession is None

        response = await async_client.get(
            '/api/v1/professions/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        prosefions = response.json()
        assert response.status_code == 200
        assert len(prosefions) == len(TEST_PROFESSIONS) - 1

        deleted_rules = []
        for rule in TEST_RULES:
            if rule[0] == test_profession.title:
                deleted_rules.append(rule)

        response = await async_client.get(
            '/api/v1/rules/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rules_after_deletion = response.json()

        assert len(rules_after_deletion) == len(rules_before_deletion) - len(
            deleted_rules
        )
        for rule in deleted_rules:
            assert rule not in rules_after_deletion
        for rule in rules_after_deletion:
            assert test_profession.id != rule['profession_id']

    @pytest.mark.asyncio
    async def test_create_profession_with_same_title(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        get_test_profession_with_max_id,
    ):
        test_profession = get_test_profession_with_max_id
        profession_payload = {
            'title': test_profession.title,
            'description': 'Makes the world better',
        }

        response = await async_client.post(
            '/api/v1/professions/',
            json=profession_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )

        assert response.status_code == 400
        assert response.json()['detail'].startswith(
            'Profession with this title already exists'
        )

        exists_title = [
            profession['title']
            for profession in TEST_PROFESSIONS
            if profession['title'] != profession_payload['title']
        ][0]
        response = await async_client.patch(
            f'/api/v1/professions/{test_profession.id}',
            json={'title': exists_title, 'description': 'New description'},
            headers={'Authorization': f'Bearer {superuser_token}'},
        )

        assert response.status_code == 400
        assert response.json()['detail'].startswith(
            'Profession with this title already exists'
        )
