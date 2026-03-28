import base64
import uuid

from cryptography.fernet import Fernet
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings as app_settings
from app.domain.settings import AIProvider, AIProviderKey, NotificationSettings, TenantSettings
from app.repositories.settings_repo import SettingsRepository
from app.schemas.settings import (
    AIKeyUpsert,
    AIKeyRead,
    NotificationSettingsRead,
    NotificationSettingsUpdate,
    TenantSettingsRead,
    TenantSettingsUpdate,
)


def _get_fernet() -> Fernet:
    """
    Derive a 32-byte URL-safe base64-encoded key from SECRET_KEY.
    Fernet requires exactly 32 bytes encoded as URL-safe base64.
    """
    raw = app_settings.SECRET_KEY.encode()
    # Pad or truncate to exactly 32 bytes, then base64-encode
    key_bytes = (raw * ((32 // len(raw)) + 1))[:32]
    return Fernet(base64.urlsafe_b64encode(key_bytes))


def _encrypt(plain_text: str) -> str:
    f = _get_fernet()
    return f.encrypt(plain_text.encode()).decode()


def _decrypt(cipher_text: str) -> str:
    f = _get_fernet()
    return f.decrypt(cipher_text.encode()).decode()


def _make_key_preview(raw_key: str) -> str:
    """Return first 4 chars + '...' + last 4 chars. Falls back gracefully for short keys."""
    if len(raw_key) <= 8:
        return raw_key[:2] + "..." + raw_key[-2:]
    return raw_key[:4] + "..." + raw_key[-4:]


class SettingsService:
    @staticmethod
    async def get_or_create_settings(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> TenantSettingsRead:
        tenant_settings = await SettingsRepository.get_settings(db, tenant_id)
        if not tenant_settings:
            tenant_settings = await SettingsRepository.create_default_settings(db, tenant_id)
            await db.commit()
            await db.refresh(tenant_settings)
        return TenantSettingsRead.model_validate(tenant_settings)

    @staticmethod
    async def update_settings(
        db: AsyncSession, tenant_id: uuid.UUID, data: TenantSettingsUpdate
    ) -> TenantSettingsRead:
        tenant_settings = await SettingsRepository.get_settings(db, tenant_id)
        if not tenant_settings:
            tenant_settings = await SettingsRepository.create_default_settings(db, tenant_id)

        update_kwargs = data.model_dump(exclude_none=True)
        if update_kwargs:
            tenant_settings = await SettingsRepository.update_settings(
                db, tenant_settings, **update_kwargs
            )
        await db.commit()
        await db.refresh(tenant_settings)
        return TenantSettingsRead.model_validate(tenant_settings)

    @staticmethod
    async def list_ai_keys(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> list[AIKeyRead]:
        keys = await SettingsRepository.get_ai_keys(db, tenant_id)
        return [AIKeyRead.model_validate(k) for k in keys]

    @staticmethod
    async def upsert_ai_key(
        db: AsyncSession, tenant_id: uuid.UUID, data: AIKeyUpsert
    ) -> AIKeyRead:
        encrypted = _encrypt(data.api_key)
        preview = _make_key_preview(data.api_key)
        key = await SettingsRepository.upsert_ai_key(
            db,
            tenant_id=tenant_id,
            provider=data.provider,
            encrypted_key=encrypted,
            key_preview=preview,
            model_override=data.model_override,
        )
        await db.commit()
        await db.refresh(key)
        return AIKeyRead.model_validate(key)

    @staticmethod
    async def delete_ai_key(
        db: AsyncSession, tenant_id: uuid.UUID, provider: AIProvider
    ) -> bool:
        deleted = await SettingsRepository.delete_ai_key(db, tenant_id, provider)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"AI provider key '{provider}' not found",
            )
        await db.commit()
        return True

    @staticmethod
    async def get_or_create_notification_settings(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> NotificationSettingsRead:
        ns = await SettingsRepository.get_notification_settings(db, tenant_id)
        if not ns:
            ns = await SettingsRepository.upsert_notification_settings(db, tenant_id)
            await db.commit()
            await db.refresh(ns)
        return NotificationSettingsRead.model_validate(ns)

    @staticmethod
    async def update_notification_settings(
        db: AsyncSession, tenant_id: uuid.UUID, data: NotificationSettingsUpdate
    ) -> NotificationSettingsRead:
        update_kwargs = data.model_dump(exclude_unset=True)
        ns = await SettingsRepository.upsert_notification_settings(db, tenant_id, **update_kwargs)
        await db.commit()
        await db.refresh(ns)
        return NotificationSettingsRead.model_validate(ns)
