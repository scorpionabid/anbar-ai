import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.base import TimestampMixin, UUIDPrimaryKeyMixin


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN = "org_admin"
    WAREHOUSE_MANAGER = "warehouse_manager"
    SALES_MANAGER = "sales_manager"
    OPERATOR = "operator"
    VENDOR = "vendor"


class Permission(str, enum.Enum):
    # Inventory
    INVENTORY_READ = "inventory:read"
    INVENTORY_WRITE = "inventory:write"
    INVENTORY_MANAGE = "inventory:manage"

    # Orders & Sales
    ORDERS_READ = "orders:read"
    ORDERS_WRITE = "orders:write"
    ORDERS_MANAGE = "orders:manage"

    # Customers
    CUSTOMERS_READ = "customers:read"
    CUSTOMERS_WRITE = "customers:write"
    CUSTOMERS_MANAGE = "customers:manage"

    # Settings & Users
    SETTINGS_MANAGE = "settings:manage"
    USERS_MANAGE = "users:manage"

    # AI
    AI_USE = "ai:use"
    AI_MANAGE = "ai:manage"

    # Channels
    CHANNELS_MANAGE = "channels:manage"

    # Reports
    REPORTS_VIEW = "reports:view"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.OPERATOR
    )
    permissions: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Login tracking & brute-force protection
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="users")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
