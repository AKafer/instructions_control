import pytest


@pytest.mark.asyncio
async def test_ping(async_client):
    response = await async_client.get("/ping/")
    assert response.status_code == 200
    assert response.text == "pong"