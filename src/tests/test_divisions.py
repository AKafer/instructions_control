import os

import pytest
import pytest_asyncio
from sqlalchemy import select

from database.models import Divisions
from tests.conftest import TEST_DIVISIONS


@pytest_asyncio.fixture
async def get_test_division_with_max_id(async_db_session):
    query = select(Divisions).order_by(Divisions.id.desc()).limit(1)
    division = await async_db_session.scalar(query)
    return division


class TestDivisions:
    @pytest.mark.asyncio
    async def test_get_divisions(self, setup, async_client, superuser_token):
        response = await async_client.get(
            '/api/v1/divisions/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        divisions = response.json()
        assert response.status_code == 200
        assert len(divisions) == len(TEST_DIVISIONS)

    @pytest.mark.asyncio
    async def test_get_division_by_id(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        get_test_division_with_max_id,
    ):
        test_division = get_test_division_with_max_id

        response = await async_client.get(
            f'/api/v1/divisions/{test_division.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        division = response.json()
        assert response.status_code == 200
        assert division['id'] == test_division.id
        assert division['title'] == test_division.title
        assert division['description'] == test_division.description

        response = await async_client.get(
            f'/api/v1/divisions/{test_division.id + 1}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 404
        assert (
            response.json()['detail']
            == f'Division with id {test_division.id + 1} not found'
        )

    @pytest.mark.asyncio
    async def test_update_division(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        get_test_division_with_max_id,
    ):
        test_division = get_test_division_with_max_id
        division_payload = {
            'description': 'New description',
        }

        response = await async_client.patch(
            f'/api/v1/divisions/{test_division.id}',
            json=division_payload,
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        division = response.json()
        assert response.status_code == 200
        assert division['description'] == division_payload['description']
        assert division['title'] == test_division.title

    @pytest.mark.asyncio
    async def test_delete_division(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        get_test_division_with_max_id,
    ):
        response = await async_client.get(
            '/api/v1/divisions/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        divisions = response.json()
        assert response.status_code == 200
        assert len(divisions) == len(TEST_DIVISIONS)

        test_division = get_test_division_with_max_id
        response = await async_client.delete(
            f'/api/v1/divisions/{test_division.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 204

        response = await async_client.get(
            '/api/v1/divisions/',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        divisions = response.json()
        assert response.status_code == 200
        assert len(divisions) == len(TEST_DIVISIONS) - 1

        response = await async_client.get(
            f'/api/v1/divisions/{test_division.id}',
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 404
        assert (
            response.json()['detail']
            == f'Division with id {test_division.id} not found'
        )

    @pytest.mark.asyncio
    async def test_create_division_with_same_title(
        self,
        setup,
        async_client,
        superuser_token,
        async_db_session,
        get_test_division_with_max_id,
    ):
        test_division = get_test_division_with_max_id
        response = await async_client.post(
            '/api/v1/divisions/',
            json={
                'title': test_division.title,
                'description': 'New description',
            },
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 400
        assert response.json()['detail'].startswith(
            'Division with this title already exists'
        )

        exists_title = [
            division['title']
            for division in TEST_DIVISIONS
            if division['title'] != test_division.title
        ][0]
        response = await async_client.patch(
            f'/api/v1/divisions/{test_division.id}',
            json={
                'title': exists_title,
                'description': 'New description',
            },
            headers={'Authorization': f'Bearer {superuser_token}'},
        )
        assert response.status_code == 400
        assert response.json()['detail'].startswith(
            'Division with this title already exists'
        )
