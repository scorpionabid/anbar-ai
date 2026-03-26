import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.inventory import Inventory, MovementType, ReferenceType, StockMovement
from app.domain.order import Order, OrderStatus
from app.repositories.order_repo import OrderItemRepository, OrderRepository
from app.schemas.order import (
    OrderCreate,
    OrderListResponse,
    OrderResponse,
    OrderUpdate,
)


def _generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    suffix = str(random.randint(1000, 9999))
    return f"ORD-{now.strftime('%Y%m')}-{suffix}"


async def _reload_order(db: AsyncSession, order_id: uuid.UUID, tenant_id: uuid.UUID) -> Order:
    """Re-fetch order with items after mutations — needed post-flush."""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.tenant_id == tenant_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


class OrderService:

    @staticmethod
    async def list_orders(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        status: Optional[OrderStatus] = None,
        customer_id: Optional[uuid.UUID] = None,
        channel_id: Optional[uuid.UUID] = None,
    ) -> OrderListResponse:
        orders, total = await OrderRepository.list(
            db, tenant_id, page, per_page, status, customer_id, channel_id
        )
        return OrderListResponse(
            data=[OrderResponse.model_validate(o) for o in orders],
            total=total,
            page=page,
            per_page=per_page,
        )

    @staticmethod
    async def get_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> OrderResponse:
        order = await OrderRepository.get_by_id(db, order_id, tenant_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return OrderResponse.model_validate(order)

    @staticmethod
    async def create_order(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        data: OrderCreate,
    ) -> OrderResponse:
        # Generate a unique order number (retry once on collision)
        order_number = _generate_order_number()
        existing = await OrderRepository.get_by_order_number(db, order_number, tenant_id)
        if existing:
            order_number = _generate_order_number()

        # Create order header (status=DRAFT, totals computed after items)
        order = await OrderRepository.create(
            db,
            tenant_id=tenant_id,
            order_number=order_number,
            customer_id=data.customer_id,
            warehouse_id=data.warehouse_id,
            channel_id=data.channel_id,
            external_order_id=data.external_order_id,
            currency=data.currency,
            shipping_address=data.shipping_address,
            notes=data.notes,
            status=OrderStatus.DRAFT,
            created_by=user_id,
        )

        subtotal = Decimal("0")
        pending_movements: list[StockMovement] = []

        for item_data in data.items:
            # Lock inventory row — critical: prevents overselling under concurrency
            inv_result = await db.execute(
                select(Inventory)
                .where(
                    Inventory.tenant_id == tenant_id,
                    Inventory.warehouse_id == data.warehouse_id,
                    Inventory.variant_id == item_data.variant_id,
                )
                .with_for_update()
            )
            inv = inv_result.scalar_one_or_none()

            if not inv or inv.available < item_data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient stock for variant {item_data.variant_id}",
                )

            inv.reserved_quantity += item_data.quantity

            # Create order item — cost_price snapshot from variant if available
            order_item = await OrderItemRepository.create(
                db,
                tenant_id=tenant_id,
                order_id=order.id,
                data=item_data,
                cost_price=None,  # updated below if variant has cost_price
            )

            # Build movement with "pending" reference — updated to real order id after flush
            movement = StockMovement(
                tenant_id=tenant_id,
                inventory_id=inv.id,
                movement_type=MovementType.RESERVE,
                quantity=item_data.quantity,
                reference_type=ReferenceType.ORDER,
                reference_id=str(order.id),
                user_id=user_id,
                note="Order reserve",
            )
            db.add(movement)
            pending_movements.append(movement)

            subtotal += order_item.line_total

        # Update order totals
        order.subtotal = subtotal
        order.total_amount = subtotal - order.discount_amount + order.tax_amount

        await db.flush()
        await db.commit()

        return OrderResponse.model_validate(await _reload_order(db, order.id, tenant_id))

    @staticmethod
    async def update_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: OrderUpdate,
    ) -> OrderResponse:
        order = await OrderRepository.get_by_id(db, order_id, tenant_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.status != OrderStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only DRAFT orders can be updated",
            )
        order = await OrderRepository.update(db, order, data)
        await db.commit()
        return OrderResponse.model_validate(await _reload_order(db, order.id, tenant_id))

    @staticmethod
    async def confirm_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrderResponse:
        order = await OrderRepository.get_by_id(db, order_id, tenant_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.status != OrderStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot confirm order with status '{order.status}'",
            )

        order = await OrderRepository.update_status(
            db,
            order,
            OrderStatus.CONFIRMED,
            confirmed_at=datetime.now(timezone.utc),
        )
        await db.commit()
        return OrderResponse.model_validate(await _reload_order(db, order.id, tenant_id))

    @staticmethod
    async def cancel_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrderResponse:
        order = await OrderRepository.get_by_id(db, order_id, tenant_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        cancellable = {OrderStatus.DRAFT, OrderStatus.CONFIRMED, OrderStatus.PROCESSING}
        if order.status not in cancellable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel order with status '{order.status}'",
            )

        # Release reserved stock for each item
        items = await OrderItemRepository.list_by_order(db, order_id, tenant_id)
        for item in items:
            inv_result = await db.execute(
                select(Inventory)
                .where(
                    Inventory.tenant_id == tenant_id,
                    Inventory.warehouse_id == order.warehouse_id,
                    Inventory.variant_id == item.variant_id,
                )
                .with_for_update()
            )
            inv = inv_result.scalar_one_or_none()
            if inv and inv.reserved_quantity >= item.quantity:
                inv.reserved_quantity -= item.quantity
                db.add(StockMovement(
                    tenant_id=tenant_id,
                    inventory_id=inv.id,
                    movement_type=MovementType.RELEASE,
                    quantity=item.quantity,
                    reference_type=ReferenceType.ORDER,
                    reference_id=str(order_id),
                    user_id=user_id,
                    note="Order cancellation",
                ))

        order = await OrderRepository.update_status(
            db,
            order,
            OrderStatus.CANCELLED,
            cancelled_at=datetime.now(timezone.utc),
        )
        await db.flush()
        await db.commit()
        return OrderResponse.model_validate(await _reload_order(db, order.id, tenant_id))

    @staticmethod
    async def ship_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrderResponse:
        order = await OrderRepository.get_by_id(db, order_id, tenant_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        shippable = {OrderStatus.CONFIRMED, OrderStatus.PROCESSING}
        if order.status not in shippable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot ship order with status '{order.status}'",
            )

        # Convert RESERVE → OUT: decrease both reserved and quantity
        items = await OrderItemRepository.list_by_order(db, order_id, tenant_id)
        for item in items:
            inv_result = await db.execute(
                select(Inventory)
                .where(
                    Inventory.tenant_id == tenant_id,
                    Inventory.warehouse_id == order.warehouse_id,
                    Inventory.variant_id == item.variant_id,
                )
                .with_for_update()
            )
            inv = inv_result.scalar_one_or_none()
            if not inv:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Inventory not found for variant {item.variant_id}",
                )
            if inv.reserved_quantity < item.quantity or inv.quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient stock to ship variant {item.variant_id}",
                )
            inv.reserved_quantity -= item.quantity
            inv.quantity -= item.quantity
            db.add(StockMovement(
                tenant_id=tenant_id,
                inventory_id=inv.id,
                movement_type=MovementType.OUT,
                quantity=item.quantity,
                reference_type=ReferenceType.ORDER,
                reference_id=str(order_id),
                user_id=user_id,
                note="Order shipped",
            ))

        order = await OrderRepository.update_status(
            db,
            order,
            OrderStatus.SHIPPED,
            shipped_at=datetime.now(timezone.utc),
        )
        await db.flush()
        await db.commit()
        return OrderResponse.model_validate(await _reload_order(db, order.id, tenant_id))

    @staticmethod
    async def deliver_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> OrderResponse:
        order = await OrderRepository.get_by_id(db, order_id, tenant_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.status != OrderStatus.SHIPPED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot deliver order with status '{order.status}'",
            )

        order = await OrderRepository.update_status(
            db,
            order,
            OrderStatus.DELIVERED,
            delivered_at=datetime.now(timezone.utc),
        )
        await db.commit()
        return OrderResponse.model_validate(await _reload_order(db, order.id, tenant_id))
