import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permissions
from app.core.database import get_db
from app.domain.user import Permission, User
from app.schemas.supplier import (
    SupplierCreate,
    SupplierListResponse,
    SupplierResponse,
    SupplierUpdate,
)
from app.services.supplier_service import SupplierService

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=SupplierListResponse, summary="Tədarükçü siyahısı")
async def list_suppliers(
    page: int = Query(1, ge=1, description="Səhifə nömrəsi"),
    per_page: int = Query(20, ge=1, le=100, description="Səhifədəki element sayı"),
    is_active: Optional[bool] = Query(None, description="Filtr: Aktivlik statusu"),
    search: Optional[str] = Query(None, max_length=255, description="Axtarış (Ad, Email)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_READ)),
):
    """Bütün tədarükçülərin siyahısını pagination və axtarış ilə qaytarır."""
    return await SupplierService.list_suppliers(
        db, current_user.tenant_id, page, per_page, is_active, search
    )


@router.post("", response_model=SupplierResponse, status_code=201)
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_WRITE)),
):
    return await SupplierService.create_supplier(db, current_user.tenant_id, data)


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_READ)),
):
    return await SupplierService.get_supplier(db, supplier_id, current_user.tenant_id)


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: uuid.UUID,
    data: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_WRITE)),
):
    return await SupplierService.update_supplier(
        db, supplier_id, current_user.tenant_id, data
    )


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier(
    supplier_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_MANAGE)),
):
    await SupplierService.delete_supplier(db, supplier_id, current_user.tenant_id)
