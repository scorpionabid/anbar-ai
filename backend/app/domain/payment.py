import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.base import TimestampMixin, UUIDPrimaryKeyMixin


class PaymentMethod(str, enum.Enum):
    CASH = "cash"                       # nağd
    CARD = "card"                       # kart
    BANK_TRANSFER = "bank_transfer"     # bank köçürməsi
    ONLINE = "online"                   # online ödəniş (iyzico, stripe və s.)
    MARKETPLACE = "marketplace"         # marketplace tərəfindən toplanıb


class PaymentState(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_tenant_id", "tenant_id"),
        Index("ix_payments_order_id", "order_id"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method"), nullable=False
    )
    status: Mapped[PaymentState] = mapped_column(
        Enum(PaymentState, name="payment_state"), nullable=False, default=PaymentState.PENDING
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="AZN")
    external_payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # bank/marketplace ref nömrəsi
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship(back_populates="payments")
