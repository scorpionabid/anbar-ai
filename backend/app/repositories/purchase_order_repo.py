import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.schemas.purchase_order import PurchaseOrderItemCreate, PurchaseOrderUpdate


class PurchaseOrderRepository:
    @staticmethod
    async def list(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        status: Optional[PurchaseOrderStatus] = None,
        supplier_id: Optional[uuid.UUID] = None,
    ) -> tuple[list[PurchaseOrder], int]:
        query = select(PurchaseOrder).where(PurchaseOrder.tenant_id == tenant_id)

        if status is not None:
            query = query.where(PurchaseOrder.status == status)

        if supplier_id is not None:
            query = query.where(PurchaseOrder.supplier_id == supplier_id)

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar_one()

        query = (
            query.order_by(PurchaseOrder.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .options(selectinload(PurchaseOrder.items))
        )
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        po_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> Optional[PurchaseOrder]:
        result = await db.execute(
            select(PurchaseOrder)
            .where(
                PurchaseOrder.id == po_id,
                PurchaseOrder.tenant_id == tenant_id,
            )
            .options(selectinload(PurchaseOrder.items))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_po_number(
        db: AsyncSession,
        po_number: str,
        tenant_id: uuid.UUID,
    ) -> Optional[PurchaseOrder]:
        result = await db.execute(
            select(PurchaseOrder).where(
                PurchaseOrder.po_number == po_number,
                PurchaseOrder.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: dict,
    ) -> PurchaseOrder:
        po = PurchaseOrder(tenant_id=tenant_id, **data)
        db.add(po)
        await db.flush()
        await db.refresh(po)
        return po

    @staticmethod
    async def update(
        db: AsyncSession,
        po: PurchaseOrder,
        data: PurchaseOrderUpdate,
    ) -> PurchaseOrder:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(po, field, value)
        await db.flush()
        await db.refresh(po)
        return po

    @staticmethod
    async def delete(db: AsyncSession, po: PurchaseOrder) -> None:
        await db.delete(po)
        await db.flush()


class PurchaseOrderItemRepository:
    @staticmethod
    async def create(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        po_id: uuid.UUID,
        data: PurchaseOrderItemCreate,
    ) -> PurchaseOrderItem:
        line_total = data.ordered_quantity * data.unit_cost
        item = PurchaseOrderItem(
            tenant_id=tenant_id,
            purchase_order_id=po_id,
            variant_id=data.variant_id,
            ordered_quantity=data.ordered_quantity,
            unit_cost=data.unit_cost,
            line_total=line_total,
            received_quantity=0,
        )
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        item_id: uuid.UUID,
        po_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> Optional[PurchaseOrderItem]:
        result = await db.execute(
            select(PurchaseOrderItem).where(
                PurchaseOrderItem.id == item_id,
                PurchaseOrderItem.purchase_order_id == po_id,
                PurchaseOrderItem.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_received(
        db: AsyncSession,
        item: PurchaseOrderItem,
        received_qty: int,
    ) -> PurchaseOrderItem:
        item.received_quantity += received_qty
        await db.flush()
        await db.refresh(item)
        return item
