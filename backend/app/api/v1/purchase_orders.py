import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.domain.purchase_order import PurchaseOrderStatus
from app.domain.user import User, UserRole
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderListResponse,
    PurchaseOrderReceive,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
)
from app.services.purchase_order_service import PurchaseOrderService

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


@router.get("", response_model=PurchaseOrderListResponse)
async def list_purchase_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[PurchaseOrderStatus] = Query(None),
    supplier_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PurchaseOrderService.list_purchase_orders(
        db,
        current_user.tenant_id,
        page,
        per_page,
        status,
        supplier_id,
    )


@router.post("", response_model=PurchaseOrderResponse, status_code=201)
async def create_purchase_order(
    data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE_MANAGER)
    ),
):
    return await PurchaseOrderService.create_purchase_order(
        db, current_user.tenant_id, current_user.id, data
    )


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PurchaseOrderService.get_purchase_order(
        db, po_id, current_user.tenant_id
    )


@router.put("/{po_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(
    po_id: uuid.UUID,
    data: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE_MANAGER)
    ),
):
    return await PurchaseOrderService.update_purchase_order(
        db, po_id, current_user.tenant_id, data
    )


@router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_purchase_order(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ORG_ADMIN)
    ),
):
    await PurchaseOrderService.cancel_purchase_order(
        db, po_id, current_user.tenant_id
    )


@router.post("/{po_id}/receive", response_model=PurchaseOrderResponse)
async def receive_goods(
    po_id: uuid.UUID,
    data: PurchaseOrderReceive,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE_MANAGER)
    ),
):
    return await PurchaseOrderService.receive_goods(
        db, po_id, current_user.tenant_id, current_user.id, data
    )
