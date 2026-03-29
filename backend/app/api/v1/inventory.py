import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permissions
from app.core.database import get_db
from app.domain.user import Permission, User
from app.schemas.inventory import (
    AdjustRequest,
    InventoryResponse,
    MovementResponse,
    ReleaseRequest,
    ReserveRequest,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=List[InventoryResponse], summary="Anbar qalıqlarının siyahısı")
async def list_inventory(
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filtr: Anbar ID-si"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_READ)),
):
    """Bütün anbar qalıqlarının siyahısını qaytarır. Anbar üzrə filtrasiya mümkündür."""
    return await InventoryService.list_inventory(db, current_user.tenant_id, warehouse_id)


@router.get("/movements", summary="Bütün stok hərəkətlərinin siyahısı")
async def list_all_movements(
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filtr: Anbar ID-si"),
    movement_type: Optional[str] = Query(None, description="Filtr: hərəkət növü (IN, OUT, RESERVE, RELEASE, ADJUSTMENT)"),
    page: int = Query(1, ge=1, description="Səhifə nömrəsi"),
    per_page: int = Query(20, ge=1, le=100, description="Səhifə başına nəticə sayı"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_READ)),
):
    """Bütün tenant-ın stok hərəkətlərini qaytarır. Anbar və hərəkət növünə görə filtrasiya mümkündür."""
    return await InventoryService.list_all_movements(
        db,
        tenant_id=current_user.tenant_id,
        warehouse_id=warehouse_id,
        movement_type=movement_type,
        page=page,
        per_page=per_page,
    )


@router.get("/{inventory_id}", response_model=InventoryResponse, summary="Spesifik anbar qalığı")
async def get_inventory(
    inventory_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_READ)),
):
    """ID vasitəsilə konkret anbar qalığı haqqında məlumat qaytarır."""
    return await InventoryService.get_inventory(db, inventory_id, current_user.tenant_id)


@router.get("/{inventory_id}/movements", response_model=List[MovementResponse], summary="Stok hərəkətləri")
async def list_movements(
    inventory_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200, description="Maksimum nəticə sayı"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_READ)),
):
    """Konkret anbar qalığı üzrə bütün giriş/çıxış/rezerv hərəkətləri siyahısını qaytarır."""
    return await InventoryService.list_movements(
        db, inventory_id, current_user.tenant_id, limit
    )


@router.post("/adjust", response_model=InventoryResponse, summary="Stok düzəlişi (Giriş/Çıxış)")
async def adjust_stock(
    data: AdjustRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_WRITE)),
):
    """
    Anbardakı məhsul miqdarını artırmaq, azaltmaq və ya birbaşa düzəliş etmək üçün istifadə olunur.
    - **IN**: Miqdar müsbət olmalıdır.
    - **OUT**: Miqdar müsbət olmalıdır (mövcud qalıq yoxlanılır).
    - **ADJUSTMENT**: Delta dəyəri (müsbət/mənfi).
    """
    return await InventoryService.adjust(
        db, current_user.tenant_id, current_user.id, data
    )


@router.post("/reserve", response_model=InventoryResponse, summary="Stok rezervasiyası")
async def reserve_stock(
    data: ReserveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_WRITE)),
):
    """
    Sifariş üçün məhsulu bloklayır. `FOR UPDATE` istifadə edərək race condition qarşısını alır.
    Qalıq kifayət etmədikdə 409 xətası qaytarır.
    """
    return await InventoryService.reserve(
        db, current_user.tenant_id, current_user.id, data
    )


@router.post("/release", response_model=InventoryResponse)
async def release_stock(
    data: ReleaseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_WRITE)),
):
    """
    Releases a previous reservation (order cancelled or expired).
    """
    return await InventoryService.release(
        db, current_user.tenant_id, current_user.id, data
    )
