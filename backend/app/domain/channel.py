import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.base import TimestampMixin, UUIDPrimaryKeyMixin


class ChannelType(str, enum.Enum):
    STORE = "store"             # öz mağazası
    MARKETPLACE = "marketplace" # Trendyol, umico.az, Amazon və s.
    WHOLESALE = "wholesale"     # topdan satış (B2B)
    API = "api"                 # custom API inteqrasiyası


class Channel(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Satış kanalları — hər kanal üçün ayrı qiymət, ayrı sifariş axını.
    """
    __tablename__ = "channels"
    __table_args__ = (
        Index("ix_channels_tenant_id", "tenant_id"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # "Öz Mağaza", "Trendyol", "umico"
    channel_type: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, name="channel_type"), nullable=False, default=ChannelType.STORE
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # API keys, webhook URL (app səviyyəsində encrypt et)

    listings: Mapped[list["ChannelListing"]] = relationship(back_populates="channel")


class ChannelListing(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Variant ↔ Kanal bağlantısı.
    Hər kanal üçün fərqli qiymət, fərqli xarici SKU.
    """
    __tablename__ = "channel_listings"
    __table_args__ = (
        UniqueConstraint("channel_id", "variant_id", name="uq_channel_listing_channel_variant"),
        Index("ix_channel_listings_tenant_id", "tenant_id"),
        Index("ix_channel_listings_channel_id", "channel_id"),
        Index("ix_channel_listings_variant_id", "variant_id"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False
    )
    external_sku: Mapped[str | None] = mapped_column(String(100), nullable=True)          # marketplace-in öz SKU-su
    external_product_id: Mapped[str | None] = mapped_column(String(255), nullable=True)   # marketplace-in product ID-si
    list_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)       # kanala görə fərqli qiymət
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    channel: Mapped["Channel"] = relationship(back_populates="listings")
    variant: Mapped["ProductVariant"] = relationship()
