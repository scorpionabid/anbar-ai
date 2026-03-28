import enum
import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.base import TimestampMixin, UUIDPrimaryKeyMixin


class WebhookEvent(str, enum.Enum):
    ORDER_CREATED = "order.created"
    ORDER_STATUS_CHANGED = "order.status_changed"
    INVENTORY_LOW_STOCK = "inventory.low_stock"
    PAYMENT_RECEIVED = "payment.received"
    PURCHASE_ORDER_CREATED = "purchase_order.created"


class Webhook(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "webhooks"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    # PostgreSQL native ARRAY(String) — stores list of WebhookEvent values
    events: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    # HMAC secret for verifying webhook payloads on the receiver side
    secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="webhooks")
