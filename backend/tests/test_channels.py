import pytest
from httpx import AsyncClient
from app.domain.channel import Channel

@pytest.mark.asyncio
async def test_list_channels_search(client: AsyncClient, db_session, auth_headers, tenant):
    # Create test channels
    c1 = Channel(tenant_id=tenant.id, name="Shopify Store", channel_type="shopify", is_active=True)
    c2 = Channel(tenant_id=tenant.id, name="Trendyol Alt", channel_type="trendyol", is_active=False)
    db_session.add_all([c1, c2])
    await db_session.commit()

    # Search by name
    response = await client.get(
        "/api/v1/channels?search=Shopify",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["name"] == "Shopify Store"

    # Search case-insensitive (ilike)
    response = await client.get(
        "/api/v1/channels?search=trendyol",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["name"] == "Trendyol Alt"

@pytest.mark.asyncio
async def test_list_channels_filter_active(client: AsyncClient, db_session, auth_headers, tenant):
    # Create active and inactive channels
    c1 = Channel(tenant_id=tenant.id, name="Active Ch", channel_type="manual", is_active=True)
    c2 = Channel(tenant_id=tenant.id, name="Inactive Ch", channel_type="manual", is_active=False)
    db_session.add_all([c1, c2])
    await db_session.commit()

    # Filter active
    response = await client.get(
        "/api/v1/channels?is_active=true",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert any(c["name"] == "Active Ch" for c in data["data"])
    assert not any(c["name"] == "Inactive Ch" for c in data["data"])

    # Filter inactive
    response = await client.get(
        "/api/v1/channels?is_active=false",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert any(c["name"] == "Inactive Ch" for c in data["data"])
    assert not any(c["name"] == "Active Ch" for c in data["data"])
