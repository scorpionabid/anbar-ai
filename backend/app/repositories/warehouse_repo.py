import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.warehouse import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate


class WarehouseRepository:
    @staticmethod
    async def list(db: AsyncSession, tenant_id: uuid.UUID) -> list[Warehouse]:
        result = await db.execute(
            select(Warehouse)
            .where(Warehouse.tenant_id == tenant_id, Warehouse.is_active == True)
            .order_by(Warehouse.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession, warehouse_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[Warehouse]:
        result = await db.execute(
            select(Warehouse).where(
                Warehouse.id == warehouse_id, Warehouse.tenant_id == tenant_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, tenant_id: uuid.UUID, data: WarehouseCreate
    ) -> Warehouse:
        warehouse = Warehouse(tenant_id=tenant_id, **data.model_dump())
        db.add(warehouse)
        await db.flush()
        await db.refresh(warehouse)
        return warehouse

    @staticmethod
    async def update(
        db: AsyncSession, warehouse: Warehouse, data: WarehouseUpdate
    ) -> Warehouse:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(warehouse, field, value)
        await db.flush()
        await db.refresh(warehouse)
        return warehouse

    @staticmethod
    async def soft_delete(db: AsyncSession, warehouse: Warehouse) -> Warehouse:
        warehouse.is_active = False
        await db.flush()
        await db.refresh(warehouse)
        return warehouse
