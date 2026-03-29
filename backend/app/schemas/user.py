import re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator

from app.domain.user import Permission, UserRole


# Default Permissions Map based on Role
DEFAULT_ROLE_PERMISSIONS: dict[UserRole, list[Permission]] = {
    UserRole.SUPER_ADMIN: list(Permission),
    UserRole.ORG_ADMIN: list(Permission),
    # Warehouse Manager: can read everything, manage inventory, see products
    UserRole.WAREHOUSE_MANAGER: [
        Permission.INVENTORY_READ,
        Permission.INVENTORY_WRITE,
        Permission.INVENTORY_MANAGE,
        Permission.CUSTOMERS_READ,
        Permission.REPORTS_VIEW,
    ],
    # Sales Manager: can read everything, manage sales/orders/customers
    UserRole.SALES_MANAGER: [
        Permission.ORDERS_READ,
        Permission.ORDERS_WRITE,
        Permission.ORDERS_MANAGE,
        Permission.CUSTOMERS_READ,
        Permission.CUSTOMERS_WRITE,
        Permission.CUSTOMERS_MANAGE,
        Permission.REPORTS_VIEW,
    ],
    # Operator: can read inventory/orders/customers, but can't manage/delete
    UserRole.OPERATOR: [
        Permission.INVENTORY_READ,
        Permission.ORDERS_READ,
        Permission.CUSTOMERS_READ,
    ],
    # Vendor: limited access, usually just to their own context (handled via logic)
    UserRole.VENDOR: [],
}


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="İstifadəçinin email ünvanı", example="user@anbar.az")
    full_name: str = Field(..., description="İstifadəçinin tam adı (Ad Soyad)", example="Əli Əliyev")
    role: UserRole = Field(..., description="İstifadəçi rolu (ORG_ADMIN, MANAGER, OPERATOR)")
    permissions: list[Permission] = Field(default_factory=list, description="Fərdi icazələrin siyahısı")
    is_active: bool = Field(True, description="İstifadəçinin aktivlik statusu")


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=8, description="Minimum 8 simvol")
    role: UserRole = UserRole.OPERATOR
    permissions: list[Permission] | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':,./<>?]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    permissions: list[Permission] | None = None
    is_active: bool | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    current_password: str | None = Field(
        None, description="Cari şifrə — new_password verildiyi halda məcburidir"
    )
    new_password: str | None = Field(None, min_length=8, description="Minimum 8 simvol")

    @field_validator("new_password")
    @classmethod
    def new_password_strength(cls, v: str | None) -> str | None:
        if v is not None:
            if len(v) < 8:
                raise ValueError("New password must be at least 8 characters")
            if not re.search(r"[A-Z]", v):
                raise ValueError("New password must contain at least one uppercase letter")
            if not re.search(r"[0-9]", v):
                raise ValueError("New password must contain at least one digit")
            if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':,./<>?]", v):
                raise ValueError("New password must contain at least one special character")
        return v


class UserRead(BaseModel):
    id: uuid.UUID = Field(..., description="İstifadəçinin unikal identifikatoru")
    email: str
    full_name: str
    role: UserRole
    permissions: list[Permission]
    is_active: bool
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
