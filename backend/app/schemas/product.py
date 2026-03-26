import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


# ── Category ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[uuid.UUID] = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    parent_id: Optional[uuid.UUID]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── ProductVariant ────────────────────────────────────────────────────────────

class ProductVariantCreate(BaseModel):
    sku: str
    name: str
    price: float = 0
    attributes: Optional[str] = None  # JSON string: {"color":"red","size":"L"}


class ProductVariantUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    attributes: Optional[str] = None


class ProductVariantResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    product_id: uuid.UUID
    sku: str
    name: str
    price: float
    attributes: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── Product ───────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    variants: List[ProductVariantCreate] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    sku: str
    description: Optional[str]
    category_id: Optional[uuid.UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    variants: List[ProductVariantResponse] = []
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    data: List[ProductResponse]
    total: int
    page: int
    per_page: int
