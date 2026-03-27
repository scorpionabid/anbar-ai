"""
Auth API inteqrasiya testləri.

app/api/v1/auth.py — login, JWT qaytarma, qorunan route testləri.

Test strukturu:
  - Düzgün credentials ilə JWT qaytarılır
  - Yanlış şifrə 401 verməlidir
  - Token olmadan qorunan route 401 verməlidir
  - /me endpoint öz məlumatlarını qaytarır
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.domain.tenant import Tenant
from app.domain.user import User, UserRole


# ── Login ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_returns_jwt_tokens(
    client: AsyncClient,
    db_session: AsyncSession,
    tenant: Tenant,
):
    """
    Düzgün email/şifrə ilə login access_token və refresh_token qaytarmalıdır.
    technopass.md §5.2: 'JWT Access Token + Refresh Token'.
    """
    import uuid
    # Test istifadəçisi birbaşa DB-yə əlavə edilir
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=f"login-test-{uuid.uuid4().hex[:4]}@test.az",
        hashed_password=hash_password("SecurePass123!"),
        full_name="Login Test",
        role=UserRole.OPERATOR,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/v1/auth/login",
        data={"username": user.email, "password": "SecurePass123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(
    client: AsyncClient,
    db_session: AsyncSession,
    tenant: Tenant,
):
    """Yanlış şifrə ilə login 401 Unauthorized verməlidir."""
    import uuid
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=f"wrong-pw-{uuid.uuid4().hex[:4]}@test.az",
        hashed_password=hash_password("RealPass123!"),
        full_name="Wrong PW Test",
        role=UserRole.OPERATOR,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/v1/auth/login",
        data={"username": user.email, "password": "YanlisPassword!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user_returns_401(client: AsyncClient):
    """Mövcud olmayan istifadəçi ilə login 401 verməlidir."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "ghost@notexist.az", "password": "AnyPass123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_inactive_user_login_returns_403(
    client: AsyncClient,
    db_session: AsyncSession,
    tenant: Tenant,
):
    """Deaktiv istifadəçinin loginə 403 Forbidden qaytarılmalıdır."""
    import uuid
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=f"inactive-{uuid.uuid4().hex[:4]}@test.az",
        hashed_password=hash_password("Pass1234!"),
        full_name="Inactive User",
        role=UserRole.OPERATOR,
        is_active=False,  # deaktiv
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/v1/auth/login",
        data={"username": user.email, "password": "Pass1234!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 403


# ── Qorunan Route ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_protected_route_without_token_returns_401(client: AsyncClient):
    """
    Token olmadan qorunan route-a sorğu 401 verməlidir.
    technopass.md §5.2: JWT tələbi.
    """
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_invalid_token_returns_401(client: AsyncClient):
    """Etibarsız JWT ilə sorğu 401 verməlidir."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer totally.invalid.token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint_returns_current_user(
    client: AsyncClient,
    auth_headers: dict,
    admin_user: User,
):
    """/me endpoint-i cari istifadəçinin məlumatlarını qaytarmalıdır."""
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == admin_user.email
    assert data["role"] == admin_user.role.value
