import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator


# ── PurchaseOrderItemCreate ────────────────────────────────────────────────────

class PurchaseOrderItemCreate(BaseModel):
    variant_id: uuid.UUID
    ordered_quantity: int
    unit_cost: float

    @field_validator("ordered_quantity")
    @classmethod
    def ordered_quantity_ge_1(cls, v: int) -> int:
        if v < 1:
            raise ValueError("ordered_quantity must be >= 1")
        return v

    @field_validator("unit_cost")
    @classmethod
    def unit_cost_ge_0(cls, v: float) -> float:
        if v < 0:
            raise ValueError("unit_cost must be >= 0")
        return v


# ── PurchaseOrderItemResponse ─────────────────────────────────────────────────

class PurchaseOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    purchase_order_id: uuid.UUID
    variant_id: uuid.UUID
    ordered_quantity: int
    received_quantity: int
    unit_cost: float
    line_total: float
    created_at: datetime
    updated_at: datetime


# ── PurchaseOrderCreate ───────────────────────────────────────────────────────

class PurchaseOrderCreate(BaseModel):
    supplier_id: Optional[uuid.UUID] = None
    warehouse_id: uuid.UUID
    po_number: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]


# ── PurchaseOrderUpdate ───────────────────────────────────────────────────────

class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[uuid.UUID] = None
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None


# ── PurchaseOrderReceiveItem ──────────────────────────────────────────────────

class PurchaseOrderReceiveItem(BaseModel):
    purchase_order_item_id: uuid.UUID
    received_quantity: int

    @field_validator("received_quantity")
    @classmethod
    def received_quantity_ge_1(cls, v: int) -> int:
        if v < 1:
            raise ValueError("received_quantity must be >= 1")
        return v


# ── PurchaseOrderReceive ──────────────────────────────────────────────────────

class PurchaseOrderReceive(BaseModel):
    items: List[PurchaseOrderReceiveItem]
    notes: Optional[str] = None


# ── PurchaseOrderResponse ─────────────────────────────────────────────────────

class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    po_number: str
    supplier_id: Optional[uuid.UUID]
    warehouse_id: uuid.UUID
    status: str
    expected_delivery_date: Optional[date]
    total_amount: float
    notes: Optional[str]
    created_by: Optional[uuid.UUID]
    received_at: Optional[datetime]
    items: List[PurchaseOrderItemResponse]
    created_at: datetime
    updated_at: datetime


# ── PurchaseOrderListResponse ─────────────────────────────────────────────────

class PurchaseOrderListResponse(BaseModel):
    data: List[PurchaseOrderResponse]
    total: int
    page: int
    per_page: int
