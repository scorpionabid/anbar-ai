import uuid
from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.settings import AIProvider, DateFormat, DimensionUnit, WeightUnit


class TenantSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    currency: str
    weight_unit: WeightUnit
    dimension_unit: DimensionUnit
    timezone: str
    tax_rate: Decimal
    low_stock_threshold: int
    date_format: DateFormat
    created_at: datetime
    updated_at: datetime


class TenantSettingsUpdate(BaseModel):
    currency: str | None = Field(None, min_length=1, max_length=3)
    weight_unit: WeightUnit | None = None
    dimension_unit: DimensionUnit | None = None
    timezone: str | None = Field(None, max_length=50)
    tax_rate: Decimal | None = Field(None, ge=Decimal("0.0"), le=Decimal("100.0"))
    low_stock_threshold: int | None = Field(None, ge=0)
    date_format: DateFormat | None = None

    @field_validator("currency")
    @classmethod
    def currency_uppercase(cls, v: str | None) -> str | None:
        if v is not None:
            return v.upper()
        return v


class AIKeyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    provider: AIProvider
    key_preview: str
    model_override: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AIKeyUpsert(BaseModel):
    provider: AIProvider
    api_key: str = Field(..., min_length=1)
    model_override: str | None = Field(None, max_length=100)


class NotificationSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email_low_stock: bool
    email_new_order: bool
    email_payment: bool
    low_stock_email: str | None


class NotificationSettingsUpdate(BaseModel):
    email_low_stock: bool | None = None
    email_new_order: bool | None = None
    email_payment: bool | None = None
    low_stock_email: str | None = None
