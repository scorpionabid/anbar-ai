import enum
import uuid
from decimal import Decimal

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.base import TimestampMixin, UUIDPrimaryKeyMixin


class WeightUnit(str, enum.Enum):
    KG = "kg"
    G = "g"
    LB = "lb"
    OZ = "oz"


class DimensionUnit(str, enum.Enum):
    CM = "cm"
    M = "m"
    IN = "in"
    FT = "ft"


class DateFormat(str, enum.Enum):
    DMY = "DD.MM.YYYY"
    MDY = "MM/DD/YYYY"
    YMD = "YYYY-MM-DD"


class AIProvider(str, enum.Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    AZURE_OPENAI = "azure_openai"
    MISTRAL = "mistral"


class TenantSettings(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tenant_settings"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="AZN")
    weight_unit: Mapped[WeightUnit] = mapped_column(
        Enum(WeightUnit, name="weight_unit"),
        nullable=False,
        default=WeightUnit.KG,
    )
    dimension_unit: Mapped[DimensionUnit] = mapped_column(
        Enum(DimensionUnit, name="dimension_unit"),
        nullable=False,
        default=DimensionUnit.CM,
    )
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="Asia/Baku")
    tax_rate: Mapped[Decimal] = mapped_column(
        Numeric(precision=5, scale=2), nullable=False, default=Decimal("18.00")
    )
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    date_format: Mapped[DateFormat] = mapped_column(
        Enum(DateFormat, name="date_format"),
        nullable=False,
        default=DateFormat.DMY,
    )

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="settings")


class NotificationSettings(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "notification_settings"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    email_low_stock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    email_new_order: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    email_payment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # target email for notifications — if None, use the tenant admin's email
    low_stock_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="notification_settings")


class AIProviderKey(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ai_provider_keys"

    __table_args__ = (
        UniqueConstraint("tenant_id", "provider", name="uq_ai_provider_keys_tenant_provider"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[AIProvider] = mapped_column(
        Enum(AIProvider, name="ai_provider"),
        nullable=False,
    )
    api_key_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    key_preview: Mapped[str] = mapped_column(String(20), nullable=False)
    model_override: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="ai_keys")
