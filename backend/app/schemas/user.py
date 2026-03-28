import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator

from app.domain.user import UserRole


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="İstifadəçinin email ünvanı", example="user@anbar.az")
    full_name: str = Field(..., description="İstifadəçinin tam adı (Ad Soyad)", example="Əli Əliyev")
    role: UserRole = Field(..., description="İstifadəçi rolu (ORG_ADMIN, MANAGER, OPERATOR)")
    is_active: bool = Field(True, description="İstifadəçinin aktivlik statusu")


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=8, description="Minimum 8 simvol")
    role: UserRole = UserRole.OPERATOR

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
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
    def new_password_min_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) < 8:
            raise ValueError("New password must be at least 8 characters")
        return v


class UserRead(BaseModel):
    id: uuid.UUID = Field(..., description="İstifadəçinin unikal identifikatoru")
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
