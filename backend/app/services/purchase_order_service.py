import random
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.inventory import Inventory, MovementType, ReferenceType, StockMovement
from app.domain.purchase_order import PurchaseOrder, PurchaseOrderStatus
from app.repositories.purchase_order_repo import (
    PurchaseOrderItemRepository,
    PurchaseOrderRepository,
)
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderListResponse,
    PurchaseOrderReceive,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
)


def _generate_po_number() -> str:
    """Auto-generate a PO number in the format PO-YYYYMM-XXXX."""
    now = datetime.now(tz=timezone.utc)
    suffix = random.randint(1000, 9999)
    return f"PO-{now.strftime('%Y%m')}-{suffix}"


class PurchaseOrderService:
    @staticmethod
    async def list_purchase_orders(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        status: PurchaseOrderStatus | None = None,
        supplier_id: uuid.UUID | None = None,
    ) -> PurchaseOrderListResponse:
        pos, total = await PurchaseOrderRepository.list(
            db, tenant_id, page, per_page, status, supplier_id
        )
        return PurchaseOrderListResponse(
            data=[PurchaseOrderResponse.model_validate(po) for po in pos],
            total=total,
            page=page,
            per_page=per_page,
        )

    @staticmethod
    async def get_purchase_order(
        db: AsyncSession,
        po_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> PurchaseOrderResponse:
        po = await PurchaseOrderRepository.get_by_id(db, po_id, tenant_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )
        return PurchaseOrderResponse.model_validate(po)

    @staticmethod
    async def create_purchase_order(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        data: PurchaseOrderCreate,
    ) -> PurchaseOrderResponse:
        # Resolve or generate PO number
        po_number = data.po_number
        if not po_number:
            # Regenerate until unique (extremely unlikely to collide, but safe)
            for _ in range(5):
                candidate = _generate_po_number()
                existing = await PurchaseOrderRepository.get_by_po_number(
                    db, candidate, tenant_id
                )
                if not existing:
                    po_number = candidate
                    break
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not generate a unique PO number, please try again",
                )
        else:
            existing = await PurchaseOrderRepository.get_by_po_number(
                db, po_number, tenant_id
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"PO number '{po_number}' already exists",
                )

        po_data = {
            "po_number": po_number,
            "supplier_id": data.supplier_id,
            "warehouse_id": data.warehouse_id,
            "status": PurchaseOrderStatus.DRAFT,
            "expected_delivery_date": data.expected_delivery_date,
            "notes": data.notes,
            "created_by": user_id,
            "total_amount": 0,
        }

        po = await PurchaseOrderRepository.create(db, tenant_id, po_data)

        total_amount = 0.0
        for item_data in data.items:
            item = await PurchaseOrderItemRepository.create(
                db, tenant_id, po.id, item_data
            )
            total_amount += float(item.line_total)

        # Update total_amount on the PO
        po.total_amount = total_amount
        await db.flush()

        await db.commit()

        # Reload with items
        po = await PurchaseOrderRepository.get_by_id(db, po.id, tenant_id)
        return PurchaseOrderResponse.model_validate(po)

    @staticmethod
    async def update_purchase_order(
        db: AsyncSession,
        po_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: PurchaseOrderUpdate,
    ) -> PurchaseOrderResponse:
        po = await PurchaseOrderRepository.get_by_id(db, po_id, tenant_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )

        editable_statuses = {PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.SENT}
        if po.status not in editable_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order can only be updated when in DRAFT or SENT status",
            )

        po = await PurchaseOrderRepository.update(db, po, data)
        await db.commit()

        po = await PurchaseOrderRepository.get_by_id(db, po.id, tenant_id)
        return PurchaseOrderResponse.model_validate(po)

    @staticmethod
    async def cancel_purchase_order(
        db: AsyncSession,
        po_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> None:
        po = await PurchaseOrderRepository.get_by_id(db, po_id, tenant_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )

        cancellable_statuses = {PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.SENT}
        if po.status not in cancellable_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order can only be cancelled when in DRAFT or SENT status",
            )

        po.status = PurchaseOrderStatus.CANCELLED
        await db.flush()
        await db.commit()

    @staticmethod
    async def receive_goods(
        db: AsyncSession,
        po_id: uuid.UUID,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        data: PurchaseOrderReceive,
    ) -> PurchaseOrderResponse:
        po = await PurchaseOrderRepository.get_by_id(db, po_id, tenant_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )

        receivable_statuses = {
            PurchaseOrderStatus.CONFIRMED,
            PurchaseOrderStatus.PARTIAL_RECEIVED,
        }
        if po.status not in receivable_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Goods can only be received when PO is CONFIRMED or PARTIAL_RECEIVED",
            )

        # Build a lookup map for fast access
        items_by_id: dict[uuid.UUID, "PurchaseOrderItem"] = {
            item.id: item for item in po.items
        }

        for receive_item in data.items:
            item = items_by_id.get(receive_item.purchase_order_item_id)
            if not item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"PO item {receive_item.purchase_order_item_id} not found in this purchase order",
                )

            remaining = item.ordered_quantity - item.received_quantity
            if receive_item.received_quantity > remaining:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Cannot receive {receive_item.received_quantity} units for item "
                        f"{item.id}: only {remaining} remaining"
                    ),
                )

            received_qty = receive_item.received_quantity

            # Find or create inventory record (with row-level lock)
            inv_result = await db.execute(
                select(Inventory)
                .where(
                    Inventory.tenant_id == tenant_id,
                    Inventory.warehouse_id == po.warehouse_id,
                    Inventory.variant_id == item.variant_id,
                )
                .with_for_update()
            )
            inv = inv_result.scalar_one_or_none()

            if not inv:
                inv = Inventory(
                    tenant_id=tenant_id,
                    warehouse_id=po.warehouse_id,
                    variant_id=item.variant_id,
                    quantity=0,
                    reserved_quantity=0,
                    incoming_quantity=0,
                )
                db.add(inv)
                await db.flush()

            inv.quantity += received_qty

            movement = StockMovement(
                tenant_id=tenant_id,
                inventory_id=inv.id,
                movement_type=MovementType.IN,
                quantity=received_qty,
                reference_type=ReferenceType.PURCHASE,
                reference_id=str(po_id),
                user_id=user_id,
                note=data.notes,
            )
            db.add(movement)

            # Update received_quantity on item
            item.received_quantity += received_qty
            await db.flush()

        # Determine new PO status
        fully_received = all(
            item.received_quantity >= item.ordered_quantity for item in po.items
        )
        if fully_received:
            po.status = PurchaseOrderStatus.RECEIVED
            po.received_at = datetime.now(tz=timezone.utc)
        else:
            po.status = PurchaseOrderStatus.PARTIAL_RECEIVED

        await db.flush()
        await db.commit()

        po = await PurchaseOrderRepository.get_by_id(db, po_id, tenant_id)
        return PurchaseOrderResponse.model_validate(po)
