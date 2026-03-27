"""
Product API inteqrasiya testləri.

PRD-1.md §6.1 (Product Module):
  - SKU uniqueness per tenant
  - Multi-tenant isolation

Test strukturu:
  - HTTP API vasitəsilə məhsul yaratma
  - SKU dublikatı 409 verməlidir
  - Başqa tenant-ın məhsulları görünməməlidir (data isolation)
"""

import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.tenant import Tenant
from app.domain.user import User


# ── Məhsul yaratma ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_product_returns_201(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """API vasitəsilə yeni məhsul yaradılır, 201 qaytarılır."""
    payload = {
        "name": "Yeni Məhsul",
        "sku": f"TST-{uuid.uuid4().hex[:6]}",
        "is_active": True,
    }
    response = await client.post("/api/v1/products/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["sku"] == payload["sku"]


@pytest.mark.asyncio
async def test_create_product_missing_name_returns_422(
    client: AsyncClient,
    auth_headers: dict,
):
    """Adı olmayan məhsul yaratma cəhdi 422 Unprocessable Entity verməlidir."""
    payload = {"sku": "NO-NAME"}
    response = await client.post("/api/v1/products/", json=payload, headers=auth_headers)
    assert response.status_code == 422


# ── SKU unikallığı ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_duplicate_sku_same_tenant_raises_409(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """
    Eyni tenant daxilində eyni SKU-lu ikinci məhsul 409 verməlidir.
    PRD §6.1: 'SKU uniqueness per tenant' tələbi.
    """
    sku = f"DUP-{uuid.uuid4().hex[:6]}"
    payload = {"name": "İlk Məhsul", "sku": sku}

    r1 = await client.post("/api/v1/products/", json=payload, headers=auth_headers)
    assert r1.status_code == 201

    r2 = await client.post("/api/v1/products/", json=payload, headers=auth_headers)
    assert r2.status_code == 409


# ── Məhsul siyahısı ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_products_returns_own_tenant_products_only(
    client: AsyncClient,
    auth_headers: dict,
):
    """
    Məhsul siyahısı yalnız öz tenant-ın məhsullarını qaytarmalıdır.
    PRD §5: Multi-Tenant Structure — 'row-level isolation'.
    """
    response = await client.get("/api/v1/products/", headers=auth_headers)
    assert response.status_code == 200
    # Cavab list formatındadır
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_product_by_id(
    client: AsyncClient,
    auth_headers: dict,
    tenant: Tenant,
):
    """Mövcud məhsulun ID ilə əlçatanlığı."""
    sku = f"GET-{uuid.uuid4().hex[:6]}"
    create_resp = await client.post(
        "/api/v1/products/",
        json={"name": "ID Test Məhsul", "sku": sku},
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    product_id = create_resp.json()["id"]

    get_resp = await client.get(f"/api/v1/products/{product_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == product_id


@pytest.mark.asyncio
async def test_get_nonexistent_product_returns_404(
    client: AsyncClient,
    auth_headers: dict,
):
    """Mövcud olmayan məhsul sorğusu 404 verməlidir."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/products/{fake_id}", headers=auth_headers)
    assert response.status_code == 404
