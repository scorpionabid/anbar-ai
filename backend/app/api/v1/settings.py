from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.domain.settings import AIProvider
from app.domain.user import User
from app.schemas.settings import (
    AIKeyRead,
    AIKeyUpsert,
    NotificationSettingsRead,
    NotificationSettingsUpdate,
    TenantSettingsRead,
    TenantSettingsUpdate,
)
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=TenantSettingsRead, summary="Tenant parametrlərini al")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cari tenant-ın parametrlərini qaytarır. Mövcud deyilsə default dəyərlərlə yaradır."""
    return await SettingsService.get_or_create_settings(db, current_user.tenant_id)


@router.put("", response_model=TenantSettingsRead, summary="Tenant parametrlərini yenilə")
async def update_settings(
    data: TenantSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tenant parametrlərini yeniləyir. Yalnız göndərilən sahələr dəyişdirilir."""
    return await SettingsService.update_settings(db, current_user.tenant_id, data)


@router.get(
    "/ai-keys",
    response_model=list[AIKeyRead],
    summary="AI provider açarlarının siyahısı",
)
async def list_ai_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tenant-a məxsus bütün AI provider açarlarını qaytarır (raw açar heç vaxt göstərilmir)."""
    return await SettingsService.list_ai_keys(db, current_user.tenant_id)


@router.post(
    "/ai-keys",
    response_model=AIKeyRead,
    summary="AI provider açarı əlavə et və ya yenilə (upsert)",
)
async def upsert_ai_key(
    data: AIKeyUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provider üzrə AI açarını yaradır və ya mövcuddursa yeniləyir. Açar şifrələnərək saxlanır."""
    return await SettingsService.upsert_ai_key(db, current_user.tenant_id, data)


@router.delete(
    "/ai-keys/{provider}",
    summary="AI provider açarını sil",
)
async def delete_ai_key(
    provider: AIProvider,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Göstərilən AI provider açarını silir."""
    await SettingsService.delete_ai_key(db, current_user.tenant_id, provider)
    return {"message": "ok"}


@router.get(
    "/notifications",
    response_model=NotificationSettingsRead,
    summary="Bildiriş parametrlərini al",
)
async def get_notification_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cari tenant-ın bildiriş parametrlərini qaytarır. Mövcud deyilsə default dəyərlərlə yaradır."""
    return await SettingsService.get_or_create_notification_settings(db, current_user.tenant_id)


@router.put(
    "/notifications",
    summary="Bildiriş parametrlərini yenilə",
)
async def update_notification_settings(
    data: NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tenant bildiriş parametrlərini yeniləyir. Yalnız göndərilən sahələr dəyişdirilir."""
    result = await SettingsService.update_notification_settings(db, current_user.tenant_id, data)
    return {"data": result, "message": "ok"}
