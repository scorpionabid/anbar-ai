import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, ConfigDict

from app.domain.channel import ChannelType


# ── Channel ───────────────────────────────────────────────────────────────────

class ChannelCreate(BaseModel):
    name: str
    channel_type: ChannelType = ChannelType.STORE
    is_active: bool = True
    config: Optional[dict] = None


class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    channel_type: Optional[ChannelType] = None
    is_active: Optional[bool] = None
    config: Optional[dict] = None


class ChannelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    channel_type: ChannelType
    is_active: bool
    config: Optional[dict]
    created_at: datetime
    updated_at: datetime


class ChannelListResponse(BaseModel):
    data: List[ChannelResponse]
    total: int
    page: int
    per_page: int


# ── ChannelListing ────────────────────────────────────────────────────────────

class ChannelListingCreate(BaseModel):
    channel_id: uuid.UUID
    variant_id: uuid.UUID
    external_sku: Optional[str] = None
    external_product_id: Optional[str] = None
    list_price: Optional[Decimal] = None
    is_active: bool = True


class ChannelListingUpdate(BaseModel):
    external_sku: Optional[str] = None
    external_product_id: Optional[str] = None
    list_price: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ChannelListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    channel_id: uuid.UUID
    variant_id: uuid.UUID
    external_sku: Optional[str]
    external_product_id: Optional[str]
    list_price: Optional[Decimal]
    is_active: bool
    last_synced_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ChannelListingListResponse(BaseModel):
    data: List[ChannelListingResponse]
    total: int
    page: int
    per_page: int
