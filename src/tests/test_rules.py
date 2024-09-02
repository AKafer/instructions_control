import pytest
import pytest_asyncio
from sqlalchemy import select, and_

from database.models import Rules, Professions, Instructions
from tests.conftest import TEST_RULES

@pytest_asyncio.fixture()
async def get_test_rule(async_db_session):
    query = select(Professions.id).where(Professions.title == TEST_RULES[-1][0])
    prof_id = await async_db_session.scalar(query)
    query = select(Instructions.id).where(Instructions.title == TEST_RULES[-1][1])
    ins_id = await async_db_session.scalar(query)
    query = select(Rules).where(
        and_(
            Rules.profession_id == prof_id,
            Rules.instruction_id == ins_id
        )
    )
    test_rule = await async_db_session.scalar(query)
    assert test_rule.profession_id == prof_id
    assert test_rule.instruction_id == ins_id
    yield test_rule, prof_id, ins_id


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
        self, setup, async_client, superuser_token, async_db_session, get_test_rule
    ):
        test_rule, prof_id, ins_id = get_test_rule
        response = await async_client.get(
            f'/api/v1/rules/{test_rule.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rule = response.json()
        assert response.status_code == 200
        assert rule['id'] == test_rule.id
        assert rule['profession_id'] == prof_id
        assert rule['instruction_id'] == ins_id
        assert rule['description'] == test_rule.description

        query = select(Rules).order_by(Rules.id.desc()).limit(1)
        rule_max_id = await async_db_session.scalar(query)
        response = await async_client.get(
            f'/api/v1/rules/{rule_max_id.id + 1}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 404
        assert (
            response.json()['detail'] == f'Rule with id {rule_max_id.id + 1} not found'
        )

    @pytest.mark.asyncio
    async def test_update_rule(
        self, setup, async_client, superuser_token, async_db_session, get_test_rule
    ):
        test_rule, prof_id, ins_id = get_test_rule

        rule_payload = {'description': 'New description'}

        response = await async_client.patch(
            f'/api/v1/rules/{test_rule.id}',
            json=rule_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rule = response.json()
        assert response.status_code == 200
        assert rule['id'] == test_rule.id
        assert rule['profession_id'] == test_rule.profession_id
        assert rule['instruction_id'] == test_rule.instruction_id
        assert rule['description'] == rule_payload['description']

    @pytest.mark.asyncio
    async def test_delete_rule(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        test_instructions_dir,
        get_test_rule
    ):
        test_rule, prof_id, ins_id = get_test_rule

        response = await async_client.delete(
            f'/api/v1/rules/{test_rule.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )

        assert response.status_code == 204
        query = select(Rules).where(Rules.id == test_rule.id)
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
            Professions.title == TEST_RULES[-1][0]
        )
        prof_id = await async_db_session.scalar(query)
        query = select(Instructions.id).where(
            Instructions.title == TEST_RULES[-1][1]
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