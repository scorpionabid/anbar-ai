import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.supplier_repo import SupplierRepository
from app.schemas.supplier import (
    SupplierCreate,
    SupplierListResponse,
    SupplierResponse,
    SupplierUpdate,
)


class SupplierService:
    @staticmethod
    async def list_suppliers(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> SupplierListResponse:
        suppliers, total = await SupplierRepository.list(
            db, tenant_id, page, per_page, is_active, search
        )
        return SupplierListResponse(
            data=[SupplierResponse.model_validate(s) for s in suppliers],
            total=total,
            page=page,
            per_page=per_page,
        )

    @staticmethod
    async def get_supplier(
        db: AsyncSession, supplier_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> SupplierResponse:
        supplier = await SupplierRepository.get_by_id(db, supplier_id, tenant_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found"
            )
        return SupplierResponse.model_validate(supplier)

    @staticmethod
    async def create_supplier(
        db: AsyncSession, tenant_id: uuid.UUID, data: SupplierCreate
    ) -> SupplierResponse:
        supplier = await SupplierRepository.create(db, tenant_id, data)
        await db.commit()
        await db.refresh(supplier)
        return SupplierResponse.model_validate(supplier)

    @staticmethod
    async def update_supplier(
        db: AsyncSession,
        supplier_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: SupplierUpdate,
    ) -> SupplierResponse:
        supplier = await SupplierRepository.get_by_id(db, supplier_id, tenant_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found"
            )
        supplier = await SupplierRepository.update(db, supplier, data)
        await db.commit()
        return SupplierResponse.model_validate(supplier)

    @staticmethod
    async def delete_supplier(
        db: AsyncSession, supplier_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        supplier = await SupplierRepository.get_by_id(db, supplier_id, tenant_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found"
            )
        await SupplierRepository.delete(db, supplier)
        await db.commit()
