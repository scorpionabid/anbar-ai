from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.base import TimestampMixin, UUIDPrimaryKeyMixin


class Tenant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="tenant")
    warehouses: Mapped[list["Warehouse"]] = relationship(back_populates="tenant")
    products: Mapped[list["Product"]] = relationship(back_populates="tenant")
    settings: Mapped["TenantSettings"] = relationship(
        "TenantSettings", back_populates="tenant", uselist=False
    )
    ai_keys: Mapped[list["AIProviderKey"]] = relationship(
        "AIProviderKey", back_populates="tenant"
    )
    notification_settings: Mapped["NotificationSettings"] = relationship(
        "NotificationSettings", back_populates="tenant", uselist=False
    )
    webhooks: Mapped[list["Webhook"]] = relationship(
        "Webhook", back_populates="tenant"
    )
