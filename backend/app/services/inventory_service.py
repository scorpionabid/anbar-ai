import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.inventory import MovementType, ReferenceType, StockMovement
from app.repositories.inventory_repo import InventoryRepository
from app.schemas.inventory import (
    AdjustRequest,
    InventoryResponse,
    MovementResponse,
    ReleaseRequest,
    ReserveRequest,
)


class InventoryService:

    @staticmethod
    async def list_inventory(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        warehouse_id: Optional[uuid.UUID] = None,
    ) -> list[InventoryResponse]:
        rows = await InventoryRepository.get_all(db, tenant_id, warehouse_id)
        return [InventoryResponse.model_validate(r) for r in rows]

    @staticmethod
    async def get_inventory(
        db: AsyncSession, inventory_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> InventoryResponse:
        inv = await InventoryRepository.get_by_id(db, inventory_id, tenant_id)
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory not found")
        return InventoryResponse.model_validate(inv)

    @staticmethod
    async def list_movements(
        db: AsyncSession,
        inventory_id: uuid.UUID,
        tenant_id: uuid.UUID,
        limit: int = 50,
    ) -> list[MovementResponse]:
        inv = await InventoryRepository.get_by_id(db, inventory_id, tenant_id)
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory not found")
        movements = await InventoryRepository.list_movements(db, inventory_id, tenant_id, limit)
        return [MovementResponse.model_validate(m) for m in movements]

    # ── Adjust (IN / OUT / ADJUSTMENT) ───────────────────────────────────────

    @staticmethod
    async def adjust(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        data: AdjustRequest,
    ) -> InventoryResponse:
        # Get or create inventory row with FOR UPDATE lock
        inv = await InventoryRepository.get_for_update(
            db, data.warehouse_id, data.variant_id, tenant_id
        )
        if not inv:
            inv = await InventoryRepository.create(
                db, tenant_id, data.warehouse_id, data.variant_id
            )
            inv = await InventoryRepository.get_for_update(
                db, data.warehouse_id, data.variant_id, tenant_id
            )

        if data.movement_type == MovementType.IN:
            if data.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="IN quantity must be positive",
                )
            inv.quantity += data.quantity

        elif data.movement_type == MovementType.OUT:
            if data.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OUT quantity must be positive",
                )
            if inv.available < data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient stock. Available: {inv.available}, requested: {data.quantity}",
                )
            inv.quantity -= data.quantity

        elif data.movement_type == MovementType.ADJUSTMENT:
            new_qty = inv.quantity + data.quantity
            if new_qty < inv.reserved_quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Adjustment would put quantity below reserved ({inv.reserved_quantity})",
                )
            inv.quantity = new_qty

        db.add(StockMovement(
            tenant_id=tenant_id,
            inventory_id=inv.id,
            movement_type=data.movement_type,
            quantity=abs(data.quantity),
            reference_type=data.reference_type,
            reference_id=data.reference_id,
            user_id=user_id,
            note=data.note,
        ))
        await db.flush()

        inv_id = inv.id
        inv = await InventoryRepository.get_by_id(db, inv_id, tenant_id)
        return InventoryResponse.model_validate(inv)

    # ── Reserve ───────────────────────────────────────────────────────────────

    @staticmethod
    async def reserve(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        data: ReserveRequest,
    ) -> InventoryResponse:
        inv = await InventoryRepository.get_for_update(
            db, data.warehouse_id, data.variant_id, tenant_id
        )
        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No inventory row found for this warehouse/variant",
            )
        if inv.available < data.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Insufficient stock. Available: {inv.available}, requested: {data.quantity}",
            )

        inv.reserved_quantity += data.quantity
        db.add(StockMovement(
            tenant_id=tenant_id,
            inventory_id=inv.id,
            movement_type=MovementType.RESERVE,
            quantity=data.quantity,
            reference_type=ReferenceType.ORDER,
            reference_id=data.reference_id,
            user_id=user_id,
            note=data.note,
        ))
        await db.flush()

        inv_id = inv.id
        inv = await InventoryRepository.get_by_id(db, inv_id, tenant_id)
        return InventoryResponse.model_validate(inv)

    # ── Release ───────────────────────────────────────────────────────────────

    @staticmethod
    async def release(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        data: ReleaseRequest,
    ) -> InventoryResponse:
        inv = await InventoryRepository.get_by_id_for_update(
            db, data.inventory_id, tenant_id
        )
        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Inventory not found"
            )
        release_qty = min(data.quantity, inv.reserved_quantity)
        if release_qty <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No reserved quantity to release",
            )

        inv.reserved_quantity -= release_qty
        db.add(StockMovement(
            tenant_id=tenant_id,
            inventory_id=inv.id,
            movement_type=MovementType.RELEASE,
            quantity=release_qty,
            reference_type=ReferenceType.ORDER,
            reference_id=data.reference_id,
            user_id=user_id,
            note=data.note,
        ))
        await db.flush()

        inv_id = inv.id
        inv = await InventoryRepository.get_by_id(db, inv_id, tenant_id)
        return InventoryResponse.model_validate(inv)
