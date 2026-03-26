import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderItemCreate, OrderUpdate


class OrderRepository:
    @staticmethod
    async def list(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        status: Optional[OrderStatus] = None,
        customer_id: Optional[uuid.UUID] = None,
        channel_id: Optional[uuid.UUID] = None,
    ) -> tuple[list[Order], int]:
        query = (
            select(Order)
            .where(Order.tenant_id == tenant_id)
            .options(selectinload(Order.items))
        )
        if status is not None:
            query = query.where(Order.status == status)
        if customer_id is not None:
            query = query.where(Order.customer_id == customer_id)
        if channel_id is not None:
            query = query.where(Order.channel_id == channel_id)

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar_one()

        query = (
            query
            .order_by(Order.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> Optional[Order]:
        result = await db.execute(
            select(Order)
            .where(Order.id == order_id, Order.tenant_id == tenant_id)
            .options(selectinload(Order.items))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_order_number(
        db: AsyncSession,
        order_number: str,
        tenant_id: uuid.UUID,
    ) -> Optional[Order]:
        result = await db.execute(
            select(Order)
            .where(Order.order_number == order_number, Order.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        **kwargs,
    ) -> Order:
        order = Order(tenant_id=tenant_id, **kwargs)
        db.add(order)
        await db.flush()
        return order

    @staticmethod
    async def update(
        db: AsyncSession,
        order: Order,
        data: OrderUpdate,
    ) -> Order:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(order, field, value)
        await db.flush()
        return order

    @staticmethod
    async def update_status(
        db: AsyncSession,
        order: Order,
        status: OrderStatus,
        **timestamp_kwargs,
    ) -> Order:
        order.status = status
        for field, value in timestamp_kwargs.items():
            setattr(order, field, value)
        await db.flush()
        return order


class OrderItemRepository:
    @staticmethod
    async def create(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        order_id: uuid.UUID,
        data: OrderItemCreate,
        cost_price: Optional[Decimal] = None,
    ) -> OrderItem:
        line_total = (data.unit_price * data.quantity) - data.discount_amount
        item = OrderItem(
            tenant_id=tenant_id,
            order_id=order_id,
            variant_id=data.variant_id,
            quantity=data.quantity,
            unit_price=data.unit_price,
            cost_price=cost_price,
            discount_amount=data.discount_amount,
            line_total=line_total,
        )
        db.add(item)
        await db.flush()
        return item

    @staticmethod
    async def list_by_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> list[OrderItem]:
        result = await db.execute(
            select(OrderItem)
            .where(
                OrderItem.order_id == order_id,
                OrderItem.tenant_id == tenant_id,
            )
            .order_by(OrderItem.created_at)
        )
        return list(result.scalars().all())
