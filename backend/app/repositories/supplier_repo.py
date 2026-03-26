import uuid
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate


class SupplierRepository:
    @staticmethod
    async def list(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Supplier], int]:
        query = select(Supplier).where(Supplier.tenant_id == tenant_id)

        if is_active is not None:
            query = query.where(Supplier.is_active == is_active)

        if search:
            term = f"%{search}%"
            query = query.where(
                or_(
                    Supplier.name.ilike(term),
                    Supplier.contact_name.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar_one()

        query = (
            query.order_by(Supplier.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(
        db: AsyncSession, supplier_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[Supplier]:
        result = await db.execute(
            select(Supplier).where(
                Supplier.id == supplier_id,
                Supplier.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, tenant_id: uuid.UUID, data: SupplierCreate
    ) -> Supplier:
        supplier = Supplier(tenant_id=tenant_id, **data.model_dump())
        db.add(supplier)
        await db.flush()
        await db.refresh(supplier)
        return supplier

    @staticmethod
    async def update(
        db: AsyncSession, supplier: Supplier, data: SupplierUpdate
    ) -> Supplier:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(supplier, field, value)
        await db.flush()
        await db.refresh(supplier)
        return supplier

    @staticmethod
    async def delete(db: AsyncSession, supplier: Supplier) -> None:
        await db.delete(supplier)
        await db.flush()
