import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.tenant import Tenant

@pytest.mark.asyncio
async def test_create_category_with_extra_fields(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """Sifrə və açıqlama ilə kateqoriya yaradılması."""
    payload = {
        "name": "Test Cat",
        "description": "Test Desc",
        "is_active": False
    }
    response = await client.post("/api/v1/categories", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Cat"
    assert data["description"] == "Test Desc"
    assert data["is_active"] is False

@pytest.mark.asyncio
async def test_list_categories_search(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """Axtarış funksiyasının yoxlanılması."""
    # Create two categories
    await client.post("/api/v1/categories", json={"name": "Apple"}, headers=auth_headers)
    await client.post("/api/v1/categories", json={"name": "Banana"}, headers=auth_headers)

    # Search for Apple
    resp = await client.get("/api/v1/categories?search=App", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["data"]) >= 1
    assert any(c["name"] == "Apple" for c in data["data"])
    assert all("Banana" not in c["name"] for c in data["data"])

@pytest.mark.asyncio
async def test_list_categories_filter_status(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """Status üzrə filtrləmənin yoxlanılması."""
    await client.post("/api/v1/categories", json={"name": "Active Cat", "is_active": True}, headers=auth_headers)
    await client.post("/api/v1/categories", json={"name": "Inactive Cat", "is_active": False}, headers=auth_headers)

    # Filter active
    resp = await client.get("/api/v1/categories?is_active=true", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert all(c["is_active"] is True for c in data["data"])

    # Filter inactive
    resp = await client.get("/api/v1/categories?is_active=false", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert all(c["is_active"] is False for c in data["data"])

@pytest.mark.asyncio
async def test_list_categories_pagination(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """Pagination yoxlanılması."""
    # Ensure we have at least 3 categories
    for i in range(3):
        await client.post("/api/v1/categories", json={"name": f"Cat {i}"}, headers=auth_headers)

    resp = await client.get("/api/v1/categories?page=1&per_page=2", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["data"]) == 2
    assert data["total"] >= 3
    assert data["page"] == 1
    assert data["per_page"] == 2

@pytest.mark.asyncio
async def test_update_category(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """Kateqoriyanın yenilənməsinin yoxlanılması."""
    # Create
    resp = await client.post("/api/v1/categories", json={"name": "Old Name"}, headers=auth_headers)
    cat_id = resp.json()["id"]

    # Update
    payload = {"name": "New Name", "is_active": False}
    resp = await client.put(f"/api/v1/categories/{cat_id}", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "New Name"
    assert data["is_active"] is False

@pytest.mark.asyncio
async def test_delete_category(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """Kateqoriyanın silinməsinin yoxlanılması."""
    # Create
    resp = await client.post("/api/v1/categories", json={"name": "To Delete"}, headers=auth_headers)
    cat_id = resp.json()["id"]

    # Delete
    resp = await client.delete(f"/api/v1/categories/{cat_id}", headers=auth_headers)
    assert resp.status_code == 204

    # Verify deleted
    resp = await client.get(f"/api/v1/categories/{cat_id}", headers=auth_headers)
    assert resp.status_code == 404
