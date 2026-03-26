import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.warehouse_repo import WarehouseRepository
from app.schemas.warehouse import WarehouseCreate, WarehouseResponse, WarehouseUpdate


class WarehouseService:
    @staticmethod
    async def list_warehouses(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> list[WarehouseResponse]:
        warehouses = await WarehouseRepository.list(db, tenant_id)
        return [WarehouseResponse.model_validate(w) for w in warehouses]

    @staticmethod
    async def get_warehouse(
        db: AsyncSession, warehouse_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> WarehouseResponse:
        warehouse = await WarehouseRepository.get_by_id(db, warehouse_id, tenant_id)
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found"
            )
        return WarehouseResponse.model_validate(warehouse)

    @staticmethod
    async def create_warehouse(
        db: AsyncSession, tenant_id: uuid.UUID, data: WarehouseCreate
    ) -> WarehouseResponse:
        warehouse = await WarehouseRepository.create(db, tenant_id, data)
        await db.commit()
        return WarehouseResponse.model_validate(warehouse)

    @staticmethod
    async def update_warehouse(
        db: AsyncSession,
        warehouse_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: WarehouseUpdate,
    ) -> WarehouseResponse:
        warehouse = await WarehouseRepository.get_by_id(db, warehouse_id, tenant_id)
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found"
            )
        warehouse = await WarehouseRepository.update(db, warehouse, data)
        await db.commit()
        return WarehouseResponse.model_validate(warehouse)
