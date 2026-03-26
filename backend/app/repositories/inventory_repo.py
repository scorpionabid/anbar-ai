import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.inventory import Inventory, StockMovement


class InventoryRepository:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        warehouse_id: Optional[uuid.UUID] = None,
    ) -> list[Inventory]:
        query = (
            select(Inventory)
            .where(Inventory.tenant_id == tenant_id)
            .options(
                selectinload(Inventory.warehouse),
                selectinload(Inventory.variant),
            )
            .order_by(Inventory.updated_at.desc())
        )
        if warehouse_id:
            query = query.where(Inventory.warehouse_id == warehouse_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession, inventory_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[Inventory]:
        result = await db.execute(
            select(Inventory)
            .where(Inventory.id == inventory_id, Inventory.tenant_id == tenant_id)
            .options(
                selectinload(Inventory.warehouse),
                selectinload(Inventory.variant),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_warehouse_variant(
        db: AsyncSession,
        warehouse_id: uuid.UUID,
        variant_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> Optional[Inventory]:
        result = await db.execute(
            select(Inventory)
            .where(
                Inventory.warehouse_id == warehouse_id,
                Inventory.variant_id == variant_id,
                Inventory.tenant_id == tenant_id,
            )
            .options(
                selectinload(Inventory.warehouse),
                selectinload(Inventory.variant),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_for_update(
        db: AsyncSession,
        warehouse_id: uuid.UUID,
        variant_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> Optional[Inventory]:
        """Acquires a row-level lock — use inside an active transaction."""
        result = await db.execute(
            select(Inventory)
            .where(
                Inventory.warehouse_id == warehouse_id,
                Inventory.variant_id == variant_id,
                Inventory.tenant_id == tenant_id,
            )
            .with_for_update()
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id_for_update(
        db: AsyncSession, inventory_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[Inventory]:
        """Acquires a row-level lock — use inside an active transaction."""
        result = await db.execute(
            select(Inventory)
            .where(Inventory.id == inventory_id, Inventory.tenant_id == tenant_id)
            .with_for_update()
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        warehouse_id: uuid.UUID,
        variant_id: uuid.UUID,
    ) -> Inventory:
        inv = Inventory(
            tenant_id=tenant_id,
            warehouse_id=warehouse_id,
            variant_id=variant_id,
            quantity=0,
            reserved_quantity=0,
            incoming_quantity=0,
        )
        db.add(inv)
        await db.flush()
        return inv

    @staticmethod
    async def list_movements(
        db: AsyncSession,
        inventory_id: uuid.UUID,
        tenant_id: uuid.UUID,
        limit: int = 50,
    ) -> list[StockMovement]:
        result = await db.execute(
            select(StockMovement)
            .where(
                StockMovement.inventory_id == inventory_id,
                StockMovement.tenant_id == tenant_id,
            )
            .order_by(StockMovement.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
