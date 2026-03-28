import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.domain.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserProfileUpdate, UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse, summary="İstifadəçi girişi (JWT Token)")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Email və şifrə vasitəsilə autentifikasiya.
    Uğurlu giriş zamanı `access_token` və `refresh_token` qaytarır.
    """
    repo = UserRepository(db)
    user = await repo.get_by_email(form_data.username)

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    access_token = create_access_token(
        subject=str(user.id),
        extra={"role": user.role.value, "tenant_id": str(user.tenant_id)},
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


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
    if not user_id:
        raise credentials_exc

    repo = UserRepository(db)
    user = await repo.get_by_id(uuid.UUID(user_id))
    if not user or not user.is_active:
        raise credentials_exc

    access_token = create_access_token(
        subject=str(user.id),
        extra={"role": user.role.value, "tenant_id": str(user.tenant_id)},
    )
    return AccessTokenResponse(access_token=access_token)


@router.get("/me", response_model=UserRead, summary="Cari istifadəçi məlumatları")
async def get_me(current_user: User = Depends(get_current_user)):
    """JWT token vasitəsilə autentifikasiya olunmuş cari istifadəçinin profil məlumatlarını qaytarır."""
    return current_user


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
