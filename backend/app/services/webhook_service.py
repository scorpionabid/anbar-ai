import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.webhook import Webhook
from app.repositories.webhook_repo import WebhookRepository
from app.schemas.webhook import WebhookCreate, WebhookUpdate


class WebhookService:
    @staticmethod
    async def list_webhooks(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> list[Webhook]:
        return await WebhookRepository.list_by_tenant(db, tenant_id)

    @staticmethod
    async def create_webhook(
        db: AsyncSession, tenant_id: uuid.UUID, data: WebhookCreate
    ) -> Webhook:
        # Validation is handled by Pydantic schema (url https://, valid events)
        webhook = await WebhookRepository.create(db, tenant_id, data)
        await db.commit()
        await db.refresh(webhook)
        return webhook

    @staticmethod
    async def update_webhook(
        db: AsyncSession,
        webhook_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: WebhookUpdate,
    ) -> Webhook:
        webhook = await WebhookRepository.get_by_id_and_tenant(
            db, webhook_id, tenant_id
        )
        if not webhook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook tapılmadı",
            )
        update_kwargs = data.model_dump(exclude_none=True)
        if update_kwargs:
            webhook = await WebhookRepository.update(db, webhook, **update_kwargs)
        await db.commit()
        await db.refresh(webhook)
        return webhook

    @staticmethod
    async def delete_webhook(
        db: AsyncSession, webhook_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> bool:
        deleted = await WebhookRepository.delete(db, webhook_id, tenant_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook tapılmadı",
            )
        await db.commit()
        return True
