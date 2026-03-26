import uuid
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerRepository:
    @staticmethod
    async def list(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Customer], int]:
        query = select(Customer).where(Customer.tenant_id == tenant_id)

        if is_active is not None:
            query = query.where(Customer.is_active == is_active)

        if search:
            term = f"%{search}%"
            query = query.where(
                or_(
                    Customer.name.ilike(term),
                    Customer.email.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar_one()

        query = (
            query.order_by(Customer.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(
        db: AsyncSession, customer_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[Customer]:
        result = await db.execute(
            select(Customer).where(
                Customer.id == customer_id,
                Customer.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(
        db: AsyncSession, email: str, tenant_id: uuid.UUID
    ) -> Optional[Customer]:
        result = await db.execute(
            select(Customer).where(
                Customer.email == email,
                Customer.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, tenant_id: uuid.UUID, data: CustomerCreate
    ) -> Customer:
        customer = Customer(tenant_id=tenant_id, **data.model_dump())
        db.add(customer)
        await db.flush()
        await db.refresh(customer)
        return customer

    @staticmethod
    async def update(
        db: AsyncSession, customer: Customer, data: CustomerUpdate
    ) -> Customer:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(customer, field, value)
        await db.flush()
        await db.refresh(customer)
        return customer

    @staticmethod
    async def delete(db: AsyncSession, customer: Customer) -> None:
        await db.delete(customer)
        await db.flush()
