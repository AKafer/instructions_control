import pytest
from sqlalchemy import select

from database.models import Rules, Professions, Instructions
from tests.conftest import TEST_RULES


class TestRules:
    @pytest.mark.asyncio
    async def test_get_rules(
        self, setup, async_client, superuser_token, test_instructions_dir
    ):
        response = await async_client.get(
            '/api/v1/rules/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rules = response.json()
        assert response.status_code == 200
        assert len(rules) == len(TEST_RULES)

    @pytest.mark.asyncio
    async def test_get_rule_by_id(
        self, setup, async_client, superuser_token, async_db_session
    ):
        query = select(Rules)
        rules = (await async_db_session.scalars(query)).all()
        max_id = max([rule.id for rule in rules])

        response = await async_client.get(
            f'/api/v1/rules/{max_id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rule = response.json()
        assert response.status_code == 200
        assert rule['id'] == max_id
        query = select(Professions.id).where(
            Professions.title == list(TEST_RULES[-1].keys())[0]
        )
        prof_id = await async_db_session.scalar(query)
        query = select(Instructions.id).where(
            Instructions.title == list(TEST_RULES[-1].values())[0]
        )
        ins_id = await async_db_session.scalar(query)
        assert rule['profession_id'] == prof_id
        assert rule['instruction_id'] == ins_id
        assert rule['description'] == f'Test rule {prof_id} -- {ins_id}'

        response = await async_client.get(
            f'/api/v1/rules/{max_id + 1}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 404
        assert (
            response.json()['detail'] == f'Rule with id {max_id + 1} not found'
        )

    @pytest.mark.asyncio
    async def test_update_rule(
        self, setup, async_client, superuser_token, async_db_session
    ):
        query = select(Rules)
        rules = (await async_db_session.scalars(query)).all()
        max_id = max([rule.id for rule in rules])

        rule_payload = {'description': 'New description'}

        response = await async_client.patch(
            f'/api/v1/rules/{max_id}',
            json=rule_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rule = response.json()
        assert response.status_code == 200
        assert rule['id'] == max_id
        query = select(Professions.id).where(
            Professions.title == list(TEST_RULES[-1].keys())[0]
        )
        prof_id = await async_db_session.scalar(query)
        query = select(Instructions.id).where(
            Instructions.title == list(TEST_RULES[-1].values())[0]
        )
        ins_id = await async_db_session.scalar(query)
        assert rule['profession_id'] == prof_id
        assert rule['instruction_id'] == ins_id
        assert rule['description'] == rule_payload['description']

    @pytest.mark.asyncio
    async def test_delete_rule(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        test_instructions_dir,
    ):
        query = select(Rules)
        rules = (await async_db_session.scalars(query)).all()
        max_id = max([rule.id for rule in rules])

        response = await async_client.delete(
            f'/api/v1/rules/{max_id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 204
        query = select(Rules).where(Rules.id == max_id)
        rule = await async_db_session.scalar(query)
        assert rule is None

        response = await async_client.get(
            '/api/v1/rules/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rules = response.json()
        assert response.status_code == 200
        assert len(rules) == len(TEST_RULES) - 1

    @pytest.mark.asyncio
    async def test_create_rule_with_same_params(
        self, setup, async_client, superuser_token, async_db_session
    ):
        query = select(Professions.id).where(
            Professions.title == list(TEST_RULES[-1].keys())[0]
        )
        prof_id = await async_db_session.scalar(query)
        query = select(Instructions.id).where(
            Instructions.title == list(TEST_RULES[-1].values())[0]
        )
        ins_id = await async_db_session.scalar(query)

        rule_payload = {
            'profession_id': prof_id,
            'instruction_id': ins_id,
            'description': 'Duplicate rule',
        }

        response = await async_client.post(
            '/api/v1/rules/',
            json=rule_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )

        assert response.status_code == 400
        assert (
            response.json()['detail']
            == f'Rule with profession_id {prof_id} and instruction_id {ins_id} already exists'
        )

    @pytest.mark.asyncio
    async def test_create_rule_with_none_instance(
            self, setup, async_client, superuser_token, async_db_session
    ):
        query  = select(Professions).order_by(Professions.id.desc()).limit(1)
        prof_max_id = await async_db_session.scalar(query)
        query = select(Instructions).order_by(Instructions.id.desc()).limit(1)
        ins_max_id = await async_db_session.scalar(query)

        rule_payload = {
            'profession_id': prof_max_id.id + 1,
            'instruction_id': ins_max_id.id,
            'description': 'Rule with none instance',
        }

        response = await async_client.post(
            '/api/v1/rules/',
            json=rule_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )

        assert response.status_code == 404
        assert response.json()['detail'] == f'Profession with id {prof_max_id.id + 1} not found'

        rule_payload = {
            'profession_id': prof_max_id.id,
            'instruction_id': ins_max_id.id + 1,
            'description': 'Rule with none instance',
        }

        response = await async_client.post(
            '/api/v1/rules/',
            json=rule_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )

        assert response.status_code == 404
        assert response.json()['detail'] == f'Instruction with id {ins_max_id.id + 1} not found'