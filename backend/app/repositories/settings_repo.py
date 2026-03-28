import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.settings import AIProvider, AIProviderKey, NotificationSettings, TenantSettings


class SettingsRepository:
    @staticmethod
    async def get_settings(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> Optional[TenantSettings]:
        result = await db.execute(
            select(TenantSettings).where(TenantSettings.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_default_settings(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> TenantSettings:
        settings = TenantSettings(tenant_id=tenant_id)
        db.add(settings)
        await db.flush()
        await db.refresh(settings)
        return settings

    @staticmethod
    async def update_settings(
        db: AsyncSession, settings: TenantSettings, **kwargs
    ) -> TenantSettings:
        for field, value in kwargs.items():
            if value is not None:
                setattr(settings, field, value)
        await db.flush()
        await db.refresh(settings)
        return settings

    @staticmethod
    async def get_ai_keys(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> list[AIProviderKey]:
        result = await db.execute(
            select(AIProviderKey)
            .where(AIProviderKey.tenant_id == tenant_id)
            .order_by(AIProviderKey.provider)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_ai_key(
        db: AsyncSession, tenant_id: uuid.UUID, provider: AIProvider
    ) -> Optional[AIProviderKey]:
        result = await db.execute(
            select(AIProviderKey).where(
                AIProviderKey.tenant_id == tenant_id,
                AIProviderKey.provider == provider,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def upsert_ai_key(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        provider: AIProvider,
        encrypted_key: str,
        key_preview: str,
        model_override: str | None,
    ) -> AIProviderKey:
        existing = await SettingsRepository.get_ai_key(db, tenant_id, provider)
        if existing:
            existing.api_key_encrypted = encrypted_key
            existing.key_preview = key_preview
            existing.model_override = model_override
            existing.is_active = True
            await db.flush()
            await db.refresh(existing)
            return existing
        key = AIProviderKey(
            tenant_id=tenant_id,
            provider=provider,
            api_key_encrypted=encrypted_key,
            key_preview=key_preview,
            model_override=model_override,
        )
        db.add(key)
        await db.flush()
        await db.refresh(key)
        return key

    @staticmethod
    async def delete_ai_key(
        db: AsyncSession, tenant_id: uuid.UUID, provider: AIProvider
    ) -> bool:
        existing = await SettingsRepository.get_ai_key(db, tenant_id, provider)
        if not existing:
            return False
        await db.delete(existing)
        await db.flush()
        return True

    @staticmethod
    async def get_notification_settings(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> Optional[NotificationSettings]:
        result = await db.execute(
            select(NotificationSettings).where(NotificationSettings.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def upsert_notification_settings(
        db: AsyncSession, tenant_id: uuid.UUID, **kwargs
    ) -> NotificationSettings:
        existing = await SettingsRepository.get_notification_settings(db, tenant_id)
        if existing:
            for field, value in kwargs.items():
                if value is not None:
                    setattr(existing, field, value)
            await db.flush()
            await db.refresh(existing)
            return existing
        ns = NotificationSettings(tenant_id=tenant_id, **{k: v for k, v in kwargs.items() if v is not None})
        db.add(ns)
        await db.flush()
        await db.refresh(ns)
        return ns
