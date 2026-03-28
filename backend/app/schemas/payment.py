from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.payment import PaymentMethod, PaymentState


# ── OrderBrief ─────────────────────────────────────────────────────────────────

class OrderBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    order_number: str


# ── PaymentCreate ─────────────────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    order_id: uuid.UUID
    amount: float = Field(..., ge=0.01)
    payment_method: PaymentMethod
    currency: str = "AZN"
    external_payment_id: Optional[str] = None
    notes: Optional[str] = None


# ── PaymentUpdate ─────────────────────────────────────────────────────────────

class PaymentUpdate(BaseModel):
    status: Optional[PaymentState] = None
    external_payment_id: Optional[str] = None
    notes: Optional[str] = None


# ── PaymentResponse ───────────────────────────────────────────────────────────

class PaymentResponse(BaseModel):
    """
    Frontend ilə uyuşma:
      - Frontend `state`   gözləyir  → DB-dəki `status` sütunundan oxunur
      - Frontend `reference` gözləyir → DB-dəki `external_payment_id`-dən kopyalanır
      - Frontend `currency` gözləyir  → DB-ə əlavə edilmiş yeni sütun (default AZN)
    """
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    order_id: uuid.UUID
    order: Optional[OrderBrief] = None
    amount: float
    payment_method: PaymentMethod
    status: PaymentState          # DB sütunu adı — daxili istifadə
    state: Optional[PaymentState] = None   # Frontend gözləyir; model_validator-da doldurulur
    currency: str
    external_payment_id: Optional[str] = None
    reference: Optional[str] = None        # Frontend gözləyir; model_validator-da doldurulur
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def _populate_frontend_aliases(self) -> PaymentResponse:
        # `state` — frontend-in gözlədiyi ad; `status`-dan kopyalanır
        if self.state is None:
            self.state = self.status
        # `reference` — frontend-in gözlədiyi ad; `external_payment_id`-dən kopyalanır
        if self.reference is None:
            self.reference = self.external_payment_id
        return self


# ── PaymentListResponse ───────────────────────────────────────────────────────

class PaymentListResponse(BaseModel):
    data: List[PaymentResponse]
    total: int
    page: int
    per_page: int
