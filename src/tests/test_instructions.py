import os

import pytest
from sqlalchemy import select

import settings
from database.models import Professions, Instructions
from tests.conftest import TEST_INSTRUCTIONS


class TestInstructions:

    @pytest.mark.asyncio
    async def test_get_instructions(self, setup, async_client, superuser_token, test_instructions_dir):
        response = await async_client.get(
            "/api/v1/instructions/",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        instructions = response.json()
        assert response.status_code == 200
        assert len(instructions['items']) == len(TEST_INSTRUCTIONS)
        files = os.listdir(test_instructions_dir)
        assert len(files) == len(TEST_INSTRUCTIONS)

    @pytest.mark.asyncio
    async def test_get_instruction_by_id(self, setup, async_client, superuser_token, async_db_session):
        query = select(Instructions).where(Instructions.title == TEST_INSTRUCTIONS[0]["title"])
        ins_N_1 = await async_db_session.scalar(query)
        test_id = ins_N_1.id

        response = await async_client.get(
            f"/api/v1/instructions/{test_id}",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        instruction = response.json()
        assert response.status_code == 200
        assert instruction["id"] == test_id
        assert instruction["title"] == TEST_INSTRUCTIONS[0]["title"]
        assert instruction["number"] == TEST_INSTRUCTIONS[0]["number"]
        assert instruction["iteration"] == TEST_INSTRUCTIONS[0]["iteration"]
        assert instruction["period"] == TEST_INSTRUCTIONS[0]["period"]

        query = select(Instructions)
        instructions = await async_db_session.scalars(query)
        max_id = max([prof.id for prof in instructions])
        response = await async_client.get(
            f"/api/v1/instructions/{max_id + 1}",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        assert response.status_code == 404
        assert response.json()["detail"] == f"Instruction with id {max_id + 1} not found"


    @pytest.mark.asyncio
    async def test_update_instruction(self, setup, async_client, superuser_token, async_db_session):
        query = select(Instructions).where(Instructions.title == TEST_INSTRUCTIONS[0]["title"])
        ins_N_1 = await async_db_session.scalar(query)
        test_id = ins_N_1.id

        instruction_payload = {
            "title": "instruction_new",
            "period": 100
        }

        response = await async_client.patch(
            f"/api/v1/instructions/{test_id}",
            data=instruction_payload,
            headers={"Authorization": f"Bearer {superuser_token}"},
        )
        instruction = response.json()
        assert response.status_code == 200
        assert instruction["title"] == instruction_payload["title"]
        assert instruction["period"] == instruction_payload["period"]
        assert instruction["number"] == TEST_INSTRUCTIONS[0]["number"]
        assert instruction["iteration"] == TEST_INSTRUCTIONS[0]["iteration"]

    @pytest.mark.asyncio
    async def test_delete_instruction(
        self, setup, async_client, superuser_token, async_db_session, test_instructions_dir
    ):
        query = select(Instructions).where(Instructions.title == TEST_INSTRUCTIONS[3]["title"])
        instruction_to_delete = await async_db_session.scalar(query)
        test_id = instruction_to_delete.id
        files_before_deletion = os.listdir(test_instructions_dir)

        response = await async_client.delete(
            f"/api/v1/instructions/{test_id}",
            headers={"Authorization": f"Bearer {superuser_token}"},
        )
        assert response.status_code == 204
        query = select(Instructions).where(Instructions.id == test_id)
        instruction = await async_db_session.scalar(query)
        assert instruction is None
        files_after_deletion = os.listdir(test_instructions_dir)

        response = await async_client.get(
            "/api/v1/instructions/",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        instructions = response.json()["items"]
        assert response.status_code == 200
        assert len(instructions) == len(TEST_INSTRUCTIONS) - 1
        assert len(files_after_deletion) == len(files_before_deletion) -1

    @pytest.mark.asyncio
    async def test_create_instruction_with_same_title(self, setup, async_client, superuser_token, async_db_session):
        file = os.path.join(settings.BASE_DIR, "tests", "files", "instructions", TEST_INSTRUCTIONS[0]["filename"])
        files = {"file": open(file, "rb")}
        instruction_payload = {
            "title": TEST_INSTRUCTIONS[0]["title"],
            "number": 'N 1',
            "filename": "instruction-1.pdf",
            "iteration": True,
            "period": 7,
        }

        response = await async_client.post(
            "/api/v1/instructions/",
            files=files,
            data=instruction_payload,
            headers={"Authorization": f"Bearer {superuser_token}"},
        )
        error_slice_len = len("(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError)")
        assert response.status_code == 400
        assert response.json()["detail"][0:error_slice_len]== "(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError)"
