import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permissions
from app.core.database import get_db
from app.domain.user import Permission, User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


def _get_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.get("", response_model=list[UserRead], summary="İstifadəçilərin siyahısı")
async def list_users(
    service: UserService = Depends(_get_service),
    current_user: User = Depends(require_permissions(Permission.USERS_MANAGE)),
) -> list[UserRead]:
    """Cari tenant-a məxsus bütün istifadəçilərin siyahısını qaytarır."""
    users = await service.list_users(current_user.tenant_id)
    return [UserRead.model_validate(u) for u in users]


@router.post(
    "",
    response_model=dict,
    status_code=201,
    summary="Yeni istifadəçi yarat",
)
async def create_user(
    data: UserCreate,
    service: UserService = Depends(_get_service),
    current_user: User = Depends(require_permissions(Permission.USERS_MANAGE)),
) -> dict:
    """Cari tenant daxilində yeni istifadəçi yaradır."""
    user = await service.create_user(current_user.tenant_id, data)
    return {"data": UserRead.model_validate(user), "message": "ok"}


@router.patch(
    "/{user_id}",
    response_model=dict,
    summary="İstifadəçini yenilə",
)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    service: UserService = Depends(_get_service),
    current_user: User = Depends(require_permissions(Permission.USERS_MANAGE)),
) -> dict:
    """İstifadəçinin rol, ad və ya aktivlik statusunu yeniləyir."""
    user = await service.update_user(user_id, current_user.tenant_id, data)
    return {"data": UserRead.model_validate(user), "message": "ok"}


@router.delete(
    "/{user_id}",
    response_model=dict,
    summary="İstifadəçini deaktiv et (soft delete)",
)
async def deactivate_user(
    user_id: uuid.UUID,
    service: UserService = Depends(_get_service),
    current_user: User = Depends(require_permissions(Permission.USERS_MANAGE)),
) -> dict:
    """İstifadəçini silmir — is_active = False edir."""
    user = await service.deactivate_user(user_id, current_user.tenant_id, current_user.id)
    return {"data": UserRead.model_validate(user), "message": "ok"}


@router.delete(
    "/{user_id}/permanent",
    response_model=dict,
    summary="İstifadəçini tamamilə sil (hard delete)",
)
async def delete_user(
    user_id: uuid.UUID,
    service: UserService = Depends(_get_service),
    current_user: User = Depends(require_permissions(Permission.USERS_MANAGE)),
) -> dict:
    """İstifadəçini verilənlər bazasından tamamilə silir."""
    await service.delete_user(user_id, current_user.tenant_id, current_user.id)
    return {"message": "User permanently deleted"}
