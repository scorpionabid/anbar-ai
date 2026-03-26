import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.domain.customer import CustomerType


# ── CustomerCreate ────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    customer_type: CustomerType = CustomerType.INDIVIDUAL
    tax_number: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


# ── CustomerUpdate ────────────────────────────────────────────────────────────

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    customer_type: Optional[CustomerType] = None
    tax_number: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


# ── CustomerResponse ──────────────────────────────────────────────────────────

class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    customer_type: CustomerType
    tax_number: Optional[str]
    address: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── CustomerListResponse ──────────────────────────────────────────────────────

class CustomerListResponse(BaseModel):
    data: List[CustomerResponse]
    total: int
    page: int
    per_page: int
