import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.inventory import MovementType, ReferenceType


# ── Nested summaries ──────────────────────────────────────────────────────────

class WarehouseSummary(BaseModel):
    id: uuid.UUID
    name: str
    model_config = ConfigDict(from_attributes=True)


class VariantSummary(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    price: float
    model_config = ConfigDict(from_attributes=True)


# ── Inventory ─────────────────────────────────────────────────────────────────

class InventoryResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    warehouse_id: uuid.UUID
    variant_id: uuid.UUID
    quantity: int
    reserved_quantity: int
    incoming_quantity: int
    available: int
    warehouse: WarehouseSummary
    variant: VariantSummary
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── StockMovement ─────────────────────────────────────────────────────────────

class MovementResponse(BaseModel):
    id: uuid.UUID
    inventory_id: uuid.UUID
    movement_type: MovementType
    quantity: int
    reference_type: ReferenceType
    reference_id: Optional[str]
    user_id: Optional[uuid.UUID]
    note: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── Adjust (IN / OUT / ADJUSTMENT) ───────────────────────────────────────────

class AdjustRequest(BaseModel):
    warehouse_id: uuid.UUID
    variant_id: uuid.UUID
    quantity: int = Field(..., description="Positive for IN, negative for OUT/ADJUSTMENT delta")
    movement_type: MovementType = MovementType.IN
    reference_type: ReferenceType = ReferenceType.MANUAL
    reference_id: Optional[str] = None
    note: Optional[str] = None


# ── Reserve / Release ─────────────────────────────────────────────────────────

class ReserveRequest(BaseModel):
    warehouse_id: uuid.UUID
    variant_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    reference_id: str = Field(..., description="Order ID or temp reference")
    note: Optional[str] = None


class ReleaseRequest(BaseModel):
    inventory_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    reference_id: str
    note: Optional[str] = None
