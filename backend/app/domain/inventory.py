import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.base import TimestampMixin, UUIDPrimaryKeyMixin


class Inventory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    One row per (tenant, warehouse, variant).
    quantity         = actual stock on hand
    reserved_quantity = locked by pending orders
    available        = quantity - reserved_quantity  (computed, NOT stored)
    """
    __tablename__ = "inventory"
    __table_args__ = (
        UniqueConstraint("tenant_id", "warehouse_id", "variant_id", name="uq_inventory_tenant_warehouse_variant"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reserved_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    incoming_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    warehouse: Mapped["Warehouse"] = relationship(back_populates="inventory")
    variant: Mapped["ProductVariant"] = relationship(back_populates="inventory")
    movements: Mapped[list["StockMovement"]] = relationship(back_populates="inventory")

    @property
    def available(self) -> int:
        return self.quantity - self.reserved_quantity


class MovementType(str, enum.Enum):
    IN = "IN"              # purchase / receiving
    OUT = "OUT"            # confirmed sale
    RESERVE = "RESERVE"    # lock stock for order
    RELEASE = "RELEASE"    # unlock (cancel/expire)
    ADJUSTMENT = "ADJUSTMENT"  # manual correction


class ReferenceType(str, enum.Enum):
    ORDER = "order"
    MANUAL = "manual"
    SYSTEM = "system"
    PURCHASE = "purchase"


class StockMovement(UUIDPrimaryKeyMixin, Base):
    """
    Immutable audit log — never update or delete rows.
    """
    __tablename__ = "stock_movements"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    inventory_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False
    )
    movement_type: Mapped[MovementType] = mapped_column(
        Enum(MovementType, name="movement_type"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_type: Mapped[ReferenceType] = mapped_column(
        Enum(ReferenceType, name="reference_type"), nullable=False
    )
    reference_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # created_at only — no updated_at (immutable)
    from datetime import datetime
    from sqlalchemy import DateTime, func
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    inventory: Mapped["Inventory"] = relationship(back_populates="movements")
