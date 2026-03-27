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
    id: uuid.UUID = Field(..., description="Anbar qalığının unikal identifikatoru")
    tenant_id: uuid.UUID = Field(..., description="Müştəri (Şirkət) ID-si")
    warehouse_id: uuid.UUID = Field(..., description="Anbarın ID-si")
    variant_id: uuid.UUID = Field(..., description="Məhsul variantının ID-si")
    quantity: int = Field(..., description="Ümumi fiziki qalıq (Total physical stock)", example=100)
    reserved_quantity: int = Field(..., description="Sifarişlər üçün rezerv olunmuş miqdar", example=10)
    incoming_quantity: int = Field(..., description="Gözlənilən (yolda olan) miqdar", example=0)
    available: int = Field(..., description="Satış üçün yararlı olan miqdar (quantity - reserved_quantity)", example=90)
    warehouse: WarehouseSummary
    variant: VariantSummary
    updated_at: datetime = Field(..., description="Son yenilənmə tarixi")
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
    warehouse_id: uuid.UUID = Field(..., description="Anbarın identifikatoru")
    variant_id: uuid.UUID = Field(..., description="Məhsul variantının identifikatoru")
    quantity: int = Field(..., description="Artım üçün müsbət, azalma/düzəliş üçün mənfi dəyər", example=50)
    movement_type: MovementType = Field(MovementType.IN, description="Hərəkətin növü (IN, OUT, ADJUSTMENT)")
    reference_type: ReferenceType = Field(ReferenceType.MANUAL, description="İstinad növü (məs. PURCHASE_ORDER, MANUAL)")
    reference_id: Optional[str] = Field(None, description="Əlaqəli sənədin nömrəsi və ya ID-si", example="PO-12345")
    note: Optional[str] = Field(None, description="Əlavə qeydlər", example="İllik sayım nəticəsində düzəliş")


# ── Reserve / Release ─────────────────────────────────────────────────────────

class ReserveRequest(BaseModel):
    warehouse_id: uuid.UUID = Field(..., description="Anbarın identifikatoru")
    variant_id: uuid.UUID = Field(..., description="Məhsul variantının identifikatoru")
    quantity: int = Field(..., gt=0, description="Rezerv ediləcək miqdar", example=5)
    reference_id: str = Field(..., description="Sifariş nömrəsi və ya müvəqqəri referans", example="SO-98765")
    note: Optional[str] = Field(None, description="Əlavə qeydlər")


class ReleaseRequest(BaseModel):
    inventory_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    reference_id: str
    note: Optional[str] = None
