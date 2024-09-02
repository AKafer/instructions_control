import pytest
from sqlalchemy import select

from database.models import Professions
from tests.conftest import TEST_PROFESSIONS, TEST_RULES


class TestProfessions:

    @pytest.mark.asyncio
    async def test_get_profession(self, setup, async_client, superuser_token):
        response = await async_client.get(
            "/api/v1/professions/",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        prosefions = response.json()
        assert response.status_code == 200
        assert len(prosefions) == len(TEST_PROFESSIONS)

    @pytest.mark.asyncio
    async def test_get_profession_by_id(self, setup, async_client, superuser_token, async_db_session):
        query = select(Professions).where(Professions.title == "engineer")
        engineer = await async_db_session.scalar(query)
        test_id = engineer.id

        response = await async_client.get(
            f"/api/v1/professions/{test_id}",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        profession = response.json()
        assert response.status_code == 200
        assert profession["id"] == test_id
        assert profession["title"] == "engineer"
        assert profession["description"] == "Makes the world better"

        query = select(Professions)
        professions = await async_db_session.scalars(query)
        max_id = max([prof.id for prof in professions])
        response = await async_client.get(
            f"/api/v1/professions/{max_id + 1}",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        assert response.status_code == 404
        assert response.json()["detail"] == f"Profession with id {max_id + 1} not found"


    @pytest.mark.asyncio
    async def test_update_profession(self, setup, async_client, superuser_token, async_db_session):
        query = select(Professions).where(Professions.title == "engineer")
        engineer = await async_db_session.scalar(query)
        test_id = engineer.id

        profession_payload = {
            "title": "engineer_new",
            "description": "Makes the world more better"
        }

        response = await async_client.patch(
            f"/api/v1/professions/{test_id}",
            json=profession_payload,
            headers={"Authorization": f"Bearer {superuser_token}"},
        )
        profession = response.json()
        assert response.status_code == 200
        assert profession["title"] == profession_payload["title"]
        assert profession["description"] == profession_payload["description"]

    @pytest.mark.asyncio
    async def test_delete_profession(self, setup, async_client, superuser_token, async_db_session):
        response = await async_client.get(
            '/api/v1/rules/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rules_before_deletion = response.json()

        query = select(Professions).where(Professions.title == "profession_to_delete")
        profession_to_delete = await async_db_session.scalar(query)
        test_id = profession_to_delete.id

        response = await async_client.delete(
            f"/api/v1/professions/{test_id}",
            headers={"Authorization": f"Bearer {superuser_token}"},
        )
        assert response.status_code == 204
        query = select(Professions).where(Professions.id == test_id)
        profession = await async_db_session.scalar(query)
        assert profession is None

        response = await async_client.get(
            "/api/v1/professions/",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        prosefions = response.json()
        assert response.status_code == 200
        assert len(prosefions) == len(TEST_PROFESSIONS) - 1

        deleted_rules = []
        for rule in TEST_RULES:
            if rule[0] == profession_to_delete.title:
                deleted_rules.append(rule)

        response = await async_client.get(
            '/api/v1/rules/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rules_after_deletion = response.json()

        assert len(rules_after_deletion) == len(rules_before_deletion) - len(deleted_rules)
        for rule in deleted_rules:
            assert rule not in rules_after_deletion
        for rule in rules_after_deletion:
            assert test_id != rule["profession_id"]

    @pytest.mark.asyncio
    async def test_create_profession_with_same_title(self, setup, async_client, superuser_token, async_db_session):
        profession_payload = {
            "title": "engineer",
            "description": "Makes the world better"
        }

        response = await async_client.post(
            "/api/v1/professions/",
            json=profession_payload,
            headers={"Authorization": f"Bearer {superuser_token}"},
        )
        error_slice_len = len("(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError)")
        assert response.status_code == 400
        assert response.json()["detail"][0:error_slice_len]== "(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError)"
