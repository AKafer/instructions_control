import os

import pytest
import pytest_asyncio
from sqlalchemy import select

import settings
from database.models import Instructions
from tests.conftest import TEST_INSTRUCTIONS, TEST_RULES


@pytest_asyncio.fixture
async def get_test_instruction_with_max_id(async_db_session):
    query = select(Instructions).order_by(Instructions.id.desc()).limit(1)
    instruction = await async_db_session.scalar(query)
    return instruction


class TestInstructions:
    @pytest.mark.asyncio
    async def test_get_instructions(
        self, setup, async_client, superuser_token, test_instructions_dir
    ):
        response = await async_client.get(
            '/api/v1/instructions/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        instructions = response.json()
        assert response.status_code == 200
        assert len(instructions['items']) == len(TEST_INSTRUCTIONS)
        files = os.listdir(test_instructions_dir)
        assert len(files) == len(TEST_INSTRUCTIONS)

    @pytest.mark.asyncio
    async def test_get_instruction_by_id(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        test_instructions_dir,
            get_test_instruction_with_max_id,
    ):
        test_instruction = get_test_instruction_with_max_id

        response = await async_client.get(
            f'/api/v1/instructions/{test_instruction.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        instruction = response.json()
        assert response.status_code == 200
        assert instruction['id'] == test_instruction.id
        assert instruction['title'] == test_instruction.title
        assert instruction['number'] == test_instruction.number
        assert instruction['iteration'] == test_instruction.iteration
        assert instruction['period'] == test_instruction.period

        response = await async_client.get(
            f'/api/v1/instructions/{test_instruction.id + 1}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 404
        assert (
            response.json()['detail']
            == f'Instruction with id {test_instruction.id + 1} not found'
        )

    @pytest.mark.asyncio
    async def test_update_instruction(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
            get_test_instruction_with_max_id,
    ):
        test_instruction = get_test_instruction_with_max_id

        instruction_payload = {'title': 'instruction_new', 'period': 100}

        response = await async_client.patch(
            f'/api/v1/instructions/{test_instruction.id}',
            data=instruction_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        instruction = response.json()
        assert response.status_code == 200
        assert instruction['title'] == instruction_payload['title']
        assert instruction['period'] == instruction_payload['period']
        assert instruction['number'] == test_instruction.number
        assert instruction['iteration'] == test_instruction.iteration

    @pytest.mark.asyncio
    async def test_delete_instruction(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        test_instructions_dir,
            get_test_instruction_with_max_id,
    ):
        response = await async_client.get(
            '/api/v1/rules/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        rules_before_deletion = response.json()
        files_before_deletion = os.listdir(test_instructions_dir)

        test_instruction = get_test_instruction_with_max_id
        response = await async_client.delete(
            f'/api/v1/instructions/{test_instruction.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 204
        query = select(Instructions).where(
            Instructions.id == test_instruction.id
        )
        instruction = await async_db_session.scalar(query)
        assert instruction is None
        files_after_deletion = os.listdir(test_instructions_dir)

        response = await async_client.get(
            '/api/v1/instructions/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        instructions = response.json()['items']
        assert response.status_code == 200
        assert len(instructions) == len(TEST_INSTRUCTIONS) - 1
        assert len(files_after_deletion) == len(files_before_deletion) - 1

        deleted_rules = []
        for rule in TEST_RULES:
            if rule[1] == test_instruction.title:
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
            assert test_instruction != rule['instruction_id']

    @pytest.mark.asyncio
    async def test_create_instruction_with_same_title(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        test_instructions_dir,
            get_test_instruction_with_max_id,
    ):
        file = os.path.join(
            settings.BASE_DIR,
            'tests',
            'files',
            'instructions',
            TEST_INSTRUCTIONS[0]['filename'],
        )
        files = {'file': open(file, 'rb')}
        test_instructions = get_test_instruction_with_max_id
        instruction_payload = {
            'title': test_instructions.title,
            'number': 'N 1',
            'filename': 'instruction-1.pdf',
            'iteration': True,
            'period': 7,
        }

        response = await async_client.post(
            '/api/v1/instructions/',
            files=files,
            data=instruction_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 400
        assert response.json()['detail'].startswith(
            'Instruction with this title already exists'
        )

        exists_title = [
            instruction['title']
            for instruction in TEST_INSTRUCTIONS
            if instruction['title'] != test_instructions.title
        ][0]
        instruction_payload['title'] = exists_title
        response = await async_client.patch(
            f'/api/v1/instructions/{test_instructions.id}',
            data=instruction_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )

        assert response.status_code == 400
        assert response.json()['detail'].startswith(
            'Instruction with this title already exists'
        )
