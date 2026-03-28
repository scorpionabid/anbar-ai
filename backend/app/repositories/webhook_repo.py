import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.webhook import Webhook
from app.schemas.webhook import WebhookCreate


class WebhookRepository:
    @staticmethod
    async def list_by_tenant(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> list[Webhook]:
        result = await db.execute(
            select(Webhook)
            .where(Webhook.tenant_id == tenant_id)
            .order_by(Webhook.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id_and_tenant(
        db: AsyncSession, webhook_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Webhook | None:
        result = await db.execute(
            select(Webhook).where(
                Webhook.id == webhook_id,
                Webhook.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, tenant_id: uuid.UUID, data: WebhookCreate
    ) -> Webhook:
        webhook = Webhook(
            tenant_id=tenant_id,
            url=data.url,
            events=data.events,
            secret=data.secret,
            description=data.description,
        )
        db.add(webhook)
        await db.flush()
        await db.refresh(webhook)
        return webhook

    @staticmethod
    async def update(
        db: AsyncSession, webhook: Webhook, **kwargs
    ) -> Webhook:
        for field, value in kwargs.items():
            if value is not None:
                setattr(webhook, field, value)
        await db.flush()
        await db.refresh(webhook)
        return webhook

    @staticmethod
    async def delete(
        db: AsyncSession, webhook_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> bool:
        webhook = await WebhookRepository.get_by_id_and_tenant(
            db, webhook_id, tenant_id
        )
        if not webhook:
            return False
        await db.delete(webhook)
        await db.flush()
        return True
