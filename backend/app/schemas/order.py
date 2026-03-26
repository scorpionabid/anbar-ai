import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.order import OrderStatus, PaymentStatus


# ── OrderItem ─────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    variant_id: uuid.UUID
    quantity: int = Field(..., ge=1)
    unit_price: Decimal = Field(..., ge=0)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    order_id: uuid.UUID
    variant_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    cost_price: Optional[Decimal]
    discount_amount: Decimal
    line_total: Decimal
    created_at: datetime
    updated_at: datetime


# ── Order ─────────────────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    warehouse_id: uuid.UUID
    channel_id: Optional[uuid.UUID] = None
    external_order_id: Optional[str] = None
    currency: str = "AZN"
    shipping_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderUpdate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    channel_id: Optional[uuid.UUID] = None
    external_order_id: Optional[str] = None
    shipping_address: Optional[str] = None
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    order_number: str
    customer_id: Optional[uuid.UUID]
    warehouse_id: uuid.UUID
    channel_id: Optional[uuid.UUID]
    external_order_id: Optional[str]
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str
    shipping_address: Optional[str]
    notes: Optional[str]
    created_by: Optional[uuid.UUID]
    confirmed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []


class OrderListResponse(BaseModel):
    data: List[OrderResponse]
    total: int
    page: int
    per_page: int
