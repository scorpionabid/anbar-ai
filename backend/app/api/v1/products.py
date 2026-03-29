import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.domain.user import User
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse, summary="Məhsulların siyahısı")
async def list_products(
    page: int = Query(1, ge=1, description="Səhifə nömrəsi"),
    per_page: int = Query(20, ge=1, le=1000, description="Səhifədəki element sayı"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filtr: Kateqoriya ID-si"),
    search: Optional[str] = Query(None, description="Ad, SKU və ya təsvir üzrə axtarış"),
    is_active: Optional[bool] = Query(None, description="Aktivlik statusuna görə filtr"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bütün məhsulların siyahısını pagination ilə qaytarır. Axtarış və filtrasiya mümkündür."""
    return await ProductService.list_products(
        db, current_user.tenant_id, page, per_page, category_id, search, is_active
    )


@router.post("", response_model=ProductResponse, status_code=201, summary="Yeni məhsul yarat")
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Yeni məhsul və onun ilkin variantlarını yaradır.
    Məhsul adı və SKU unikal olmalıdır.
    """
    return await ProductService.create_product(db, current_user.tenant_id, data)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ProductService.get_product(db, product_id, current_user.tenant_id)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ProductService.update_product(
        db, product_id, current_user.tenant_id, data
    )


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ProductService.delete_product(db, product_id, current_user.tenant_id)


# ── Variants ──────────────────────────────────────────────────────────────────

@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=201)
async def add_variant(
    product_id: uuid.UUID,
    data: ProductVariantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ProductService.add_variant(
        db, product_id, current_user.tenant_id, data
    )


@router.put("/{product_id}/variants/{variant_id}", response_model=ProductVariantResponse)
async def update_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    data: ProductVariantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ProductService.update_variant(
        db, product_id, variant_id, current_user.tenant_id, data
    )
