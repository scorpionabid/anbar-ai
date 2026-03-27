import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.order import OrderStatus, PaymentStatus


# ── OrderItem ─────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    variant_id: uuid.UUID = Field(..., description="Məhsul variantının ID-si")
    quantity: int = Field(..., ge=1, description="Sifariş miqdarı", example=2)
    unit_price: Decimal = Field(..., ge=0, description="Məhsulun vahid qiyməti", example="15.50")
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0, description="Endirim məbləği")


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Sifariş sətirinin unikal identifikatoru")
    tenant_id: uuid.UUID
    order_id: uuid.UUID
    variant_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    cost_price: Optional[Decimal] = Field(None, description="Məhsulun mayalanma qiyməti (Audit və mənfəət analizi üçün)")
    discount_amount: Decimal
    line_total: Decimal = Field(..., description="Sətrin cəmi məbləği ((unit_price * quantity) - discount_amount)", example="31.00")
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

    id: uuid.UUID = Field(..., description="Sifarişin unikal identifikatoru")
    tenant_id: uuid.UUID
    order_number: str = Field(..., description="Sifariş nömrəsi (oxunaqlı formatda)", example="ORD-2024-0001")
    customer_id: Optional[uuid.UUID] = Field(None, description="Müştərinin identifikatoru")
    warehouse_id: uuid.UUID = Field(..., description="Malların göndəriləcəyi anbar")
    channel_id: Optional[uuid.UUID] = Field(None, description="Satış kanalı (məs. Store, Website)")
    external_order_id: Optional[str] = Field(None, description="Xarici platformadan gələn sifariş ID-si")
    status: OrderStatus = Field(..., description="Sifarişin cari vəziyyəti")
    payment_status: PaymentStatus = Field(..., description="Ödəniş statusu")
    subtotal: Decimal = Field(..., description="Endirimsiz və vergisiz cəmi məbləğ")
    discount_amount: Decimal = Field(..., description="Ümumi sifariş üzrə endirim")
    tax_amount: Decimal = Field(..., description="Vergi məbləği")
    total_amount: Decimal = Field(..., description="Yekun ödəniləcək məbləğ")
    currency: str = Field(..., description="Valyuta kodu", example="AZN")
    shipping_address: Optional[str] = Field(None, description="Çatdırılma ünvanı")
    notes: Optional[str] = Field(None, description="Sifariş üzrə qeydlər")
    created_by: Optional[uuid.UUID] = Field(None, description="Sifarişi yaradan istifadəçi")
    confirmed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = Field([], description="Sifariş sətirləri")


class OrderListResponse(BaseModel):
    data: List[OrderResponse]
    total: int
    page: int
    per_page: int
