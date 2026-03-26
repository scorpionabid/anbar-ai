import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.domain.order import OrderStatus
from app.domain.user import User, UserRole
from app.schemas.order import (
    OrderCreate,
    OrderListResponse,
    OrderResponse,
    OrderUpdate,
)
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = Query(None),
    customer_id: Optional[uuid.UUID] = Query(None),
    channel_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await OrderService.list_orders(
        db,
        tenant_id=current_user.tenant_id,
        page=page,
        per_page=per_page,
        status=status,
        customer_id=customer_id,
        channel_id=channel_id,
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await OrderService.create_order(
        db,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        data=data,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await OrderService.get_order(db, order_id, current_user.tenant_id)


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: uuid.UUID,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await OrderService.update_order(db, order_id, current_user.tenant_id, data)


@router.post("/{order_id}/confirm", response_model=OrderResponse)
async def confirm_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await OrderService.confirm_order(
        db,
        order_id=order_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await OrderService.cancel_order(
        db,
        order_id=order_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )


@router.post("/{order_id}/ship", response_model=OrderResponse)
async def ship_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.WAREHOUSE_MANAGER, UserRole.ORG_ADMIN)
    ),
):
    return await OrderService.ship_order(
        db,
        order_id=order_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )


@router.post("/{order_id}/deliver", response_model=OrderResponse)
async def deliver_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await OrderService.deliver_order(
        db,
        order_id=order_id,
        tenant_id=current_user.tenant_id,
    )
