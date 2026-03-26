import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.domain.user import User
from app.schemas.inventory import (
    AdjustRequest,
    InventoryResponse,
    MovementResponse,
    ReleaseRequest,
    ReserveRequest,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=List[InventoryResponse])
async def list_inventory(
    warehouse_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await InventoryService.list_inventory(db, current_user.tenant_id, warehouse_id)


@router.get("/{inventory_id}", response_model=InventoryResponse)
async def get_inventory(
    inventory_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await InventoryService.get_inventory(db, inventory_id, current_user.tenant_id)


@router.get("/{inventory_id}/movements", response_model=List[MovementResponse])
async def list_movements(
    inventory_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await InventoryService.list_movements(
        db, inventory_id, current_user.tenant_id, limit
    )


@router.post("/adjust", response_model=InventoryResponse)
async def adjust_stock(
    data: AdjustRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    IN: quantity must be positive — increases stock on hand.
    OUT: quantity must be positive — decreases stock (checks available).
    ADJUSTMENT: quantity is a delta (positive or negative) — manual correction.
    """
    return await InventoryService.adjust(
        db, current_user.tenant_id, current_user.id, data
    )


@router.post("/reserve", response_model=InventoryResponse)
async def reserve_stock(
    data: ReserveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Locks stock for an order. Uses FOR UPDATE to prevent overselling.
    Raises 409 if available < requested quantity.
    """
    return await InventoryService.reserve(
        db, current_user.tenant_id, current_user.id, data
    )


@router.post("/release", response_model=InventoryResponse)
async def release_stock(
    data: ReleaseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Releases a previous reservation (order cancelled or expired).
    """
    return await InventoryService.release(
        db, current_user.tenant_id, current_user.id, data
    )
