import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.payment import PaymentMethod, PaymentState


# ── PaymentCreate ─────────────────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    order_id: uuid.UUID
    amount: float = Field(..., ge=0.01)
    payment_method: PaymentMethod
    external_payment_id: Optional[str] = None
    notes: Optional[str] = None


# ── PaymentUpdate ─────────────────────────────────────────────────────────────

class PaymentUpdate(BaseModel):
    status: Optional[PaymentState] = None
    external_payment_id: Optional[str] = None
    notes: Optional[str] = None


# ── PaymentResponse ───────────────────────────────────────────────────────────

class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    order_id: uuid.UUID
    amount: float
    payment_method: PaymentMethod
    status: PaymentState
    external_payment_id: Optional[str]
    paid_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


# ── PaymentListResponse ───────────────────────────────────────────────────────

class PaymentListResponse(BaseModel):
    data: List[PaymentResponse]
    total: int
    page: int
    per_page: int
