import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from app.domain.user import UserRole

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="İstifadəçinin email ünvanı", example="user@anbar.az")
    full_name: str = Field(..., description="İstifadəçinin tam adı (Ad Soyad)", example="Əli Əliyev")
    role: UserRole = Field(..., description="İstifadəçi rolu (ORG_ADMIN, MANAGER, OPERATOR)")
    is_active: bool = Field(True, description="İstifadəçinin aktivlik statusu")

class UserCreate(UserBase):
    password: str
    tenant_id: uuid.UUID

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    password: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None

class UserRead(UserBase):
    id: uuid.UUID = Field(..., description="İstifadəçinin unikal identifikatoru")
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
