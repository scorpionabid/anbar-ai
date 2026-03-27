import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


# ── Category ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str = Field(..., description="Kateqoriyanın adı", example="Elektronika")
    parent_id: Optional[uuid.UUID] = Field(None, description="Valideyn kateqoriya ID-si (Tree structure üçün)")


class CategoryResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    parent_id: Optional[uuid.UUID]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── ProductVariant ────────────────────────────────────────────────────────────

class ProductVariantCreate(BaseModel):
    sku: str = Field(..., description="Variantın unikal SKU kodu", example="IPH-15-PRO-256-BLK")
    name: str = Field(..., description="Variantın adı", example="Black, 256GB")
    price: float = Field(0.0, description="Variantın satış qiyməti", example=1200.0)
    attributes: Optional[str] = Field(None, description="Variantın atributları (JSON formatda)", example='{"color":"black","storage":"256GB"}')


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
    name: str = Field(..., description="Məhsulun əsas adı", example="iPhone 15 Pro")
    sku: str = Field(..., description="Məhsulun əsas SKU kodu", example="IPH-15-PRO")
    description: Optional[str] = Field(None, description="Məhsul haqqında ətraflı məlumat")
    category_id: Optional[uuid.UUID] = Field(None, description="Kateqoriya identifikatoru")
    variants: List[ProductVariantCreate] = Field([], description="Məhsulun variantları")


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: uuid.UUID = Field(..., description="Məhsulun unikal identifikatoru")
    tenant_id: uuid.UUID
    name: str
    sku: str
    description: Optional[str]
    category_id: Optional[uuid.UUID]
    is_active: bool = Field(..., description="Məhsulun aktivlik statusu")
    created_at: datetime
    updated_at: datetime
    variants: List[ProductVariantResponse] = Field([], description="Məhsulun bütün variantları")
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    data: List[ProductResponse]
    total: int
    page: int
    per_page: int
