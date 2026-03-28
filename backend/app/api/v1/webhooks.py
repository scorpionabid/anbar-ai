import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.domain.user import User
from app.schemas.webhook import WebhookCreate, WebhookRead, WebhookUpdate
from app.services.webhook_service import WebhookService

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.get("", response_model=list[WebhookRead], summary="Webhook siyahısı")
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tenant-a məxsus bütün webhook-ları qaytarır."""
    return await WebhookService.list_webhooks(db, current_user.tenant_id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Yeni webhook yarat",
)
async def create_webhook(
    data: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yeni webhook endpoint yaradır. URL mütləq https:// ilə başlamalıdır."""
    webhook = await WebhookService.create_webhook(db, current_user.tenant_id, data)
    return {"data": WebhookRead.model_validate(webhook), "message": "ok"}


@router.patch("/{webhook_id}", summary="Webhook yenilə")
async def update_webhook(
    webhook_id: uuid.UUID,
    data: WebhookUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mövcud webhook-u yeniləyir. Yalnız göndərilən sahələr dəyişdirilir."""
    webhook = await WebhookService.update_webhook(
        db, webhook_id, current_user.tenant_id, data
    )
    return {"data": WebhookRead.model_validate(webhook), "message": "ok"}


@router.delete("/{webhook_id}", summary="Webhook sil")
async def delete_webhook(
    webhook_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Webhook-u silir."""
    await WebhookService.delete_webhook(db, webhook_id, current_user.tenant_id)
    return {"message": "ok"}
