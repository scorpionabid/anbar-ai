import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    verify_password,
)
from app.domain.refresh_token import RefreshToken
from app.domain.user import User
from app.repositories.refresh_token_repo import RefreshTokenRepository
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserProfileUpdate, UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])

# ── Constants ──────────────────────────────────────────────────────────────────
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


# ── Schemas ────────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str


# ── Login ──────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse, summary="İstifadəçi girişi (JWT Token)")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Email və şifrə vasitəsilə autentifikasiya.
    Uğurlu giriş zamanı `access_token` və `refresh_token` qaytarır.
    5 uğursuz cəhddən sonra hesab 15 dəqiqə kilidlənir.
    """
    repo = UserRepository(db)
    user = await repo.get_by_email(form_data.username)

    # ── İstifadəçi tapılmadısa ──
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # ── Hesab kilidlənibmi? ──
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        remaining = int((user.locked_until - datetime.now(timezone.utc)).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked due to too many failed attempts. Try again in {remaining} minute(s).",
        )

    # ── Şifrə doğrulama ──
    if not verify_password(form_data.password, user.hashed_password):
        # Uğursuz cəhd sayğacını artır
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            from datetime import timedelta
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # ── İstifadəçi deaktivdirsə ──
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    # ── Uğurlu login — sayğacları sıfırla ──
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)

    # ── Token-lər yarat ──
    access_token = create_access_token(
        subject=str(user.id),
        extra={"role": user.role.value, "tenant_id": str(user.tenant_id)},
    )
    raw_refresh_token, jti, expires_at = create_refresh_token(
        subject=str(user.id), extra={"tenant_id": str(user.tenant_id)}
    )

    # ── Refresh token DB-yə yaz ──
    rt_repo = RefreshTokenRepository(db)
    await rt_repo.create(
        RefreshToken(
            tenant_id=user.tenant_id,
            user_id=user.id,
            token_hash=hash_token(raw_refresh_token),
            jti=jti,
            expires_at=expires_at,
        )
    )

    await db.commit()
    print(f"DEBUG: Login transaction committed for {user.email}")
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh_token)


# ── Refresh ────────────────────────────────────────────────────────────────────
@router.post("/refresh", response_model=AccessTokenResponse, summary="Access token yenilə")
async def refresh_access_token(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh token vasitəsilə yeni access token əldə et."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise credentials_exc

    if payload.get("type") != "refresh":
        raise credentials_exc

    user_id: str | None = payload.get("sub")
    jti: str | None = payload.get("jti")
    tenant_id: str | None = payload.get("tenant_id")
    if not user_id or not jti or not tenant_id:
        raise credentials_exc

    # ── DB-dən refresh token-i yoxla ──
    rt_repo = RefreshTokenRepository(db)
    stored_token = await rt_repo.get_by_jti(jti, uuid.UUID(tenant_id))
    if not stored_token:
        raise credentials_exc

    # Token hash doğrula
    if stored_token.token_hash != hash_token(body.refresh_token):
        raise credentials_exc

    # ── İstifadəçini yoxla ──
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(uuid.UUID(user_id))
    if not user or not user.is_active:
        raise credentials_exc

    access_token = create_access_token(
        subject=str(user.id),
        extra={"role": user.role.value, "tenant_id": str(user.tenant_id)},
    )
    return AccessTokenResponse(access_token=access_token)


# ── Get Me ─────────────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserRead, summary="Cari istifadəçi məlumatları")
async def get_me(current_user: User = Depends(get_current_user)):
    """JWT token vasitəsilə autentifikasiya olunmuş cari istifadəçinin profil məlumatlarını qaytarır."""
    return current_user


# ── Update My Profile ──────────────────────────────────────────────────────────
@router.patch("/me", response_model=dict, summary="Öz profilini yenilə")
async def update_me(
    data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Cari istifadəçinin öz profil məlumatlarını yeniləyir.
    Şifrə dəyişdirmək üçün current_password məcburidir.
    """
    service = UserService(UserRepository(db))
    user = await service.update_my_profile(current_user.id, data)
    return {"data": UserRead.model_validate(user), "message": "ok"}


# ── Logout ─────────────────────────────────────────────────────────────────────
@router.post("/logout", response_model=MessageResponse, summary="Çıxış (refresh token revoke)")
async def logout(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Cari refresh token-i revoke edir — bu cihazdan çıxış."""
    try:
        payload = decode_token(body.refresh_token)
        jti = payload.get("jti")
    except JWTError:
        # Token artıq expired olub — problem yoxdur
        return MessageResponse(message="Logged out")

    if jti:
        rt_repo = RefreshTokenRepository(db)
        stored = await rt_repo.get_by_jti(jti, current_user.tenant_id)
        if stored and str(stored.user_id) == str(current_user.id):
            await rt_repo.revoke(stored)
            await db.commit()

    return MessageResponse(message="Logged out")


# ── Logout All ─────────────────────────────────────────────────────────────────
@router.post("/logout-all", response_model=MessageResponse, summary="Bütün cihazlardan çıxış")
async def logout_all(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """İstifadəçinin bütün aktiv refresh token-lərini revoke edir — bütün cihazlardan çıxış."""
    rt_repo = RefreshTokenRepository(db)
    revoked_count = await rt_repo.revoke_all_for_user(current_user.id, current_user.tenant_id)
    await db.commit()
    return MessageResponse(message=f"Logged out from all devices ({revoked_count} sessions revoked)")
