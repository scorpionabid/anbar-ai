import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.customer_repo import CustomerRepository
from app.schemas.customer import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)


class CustomerService:
    @staticmethod
    async def list_customers(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> CustomerListResponse:
        customers, total = await CustomerRepository.list(
            db, tenant_id, page, per_page, is_active, search
        )
        return CustomerListResponse(
            data=[CustomerResponse.model_validate(c) for c in customers],
            total=total,
            page=page,
            per_page=per_page,
        )

    @staticmethod
    async def get_customer(
        db: AsyncSession, customer_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> CustomerResponse:
        customer = await CustomerRepository.get_by_id(db, customer_id, tenant_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found"
            )
        return CustomerResponse.model_validate(customer)

    @staticmethod
    async def create_customer(
        db: AsyncSession, tenant_id: uuid.UUID, data: CustomerCreate
    ) -> CustomerResponse:
        # Check email uniqueness within tenant (only when email is provided)
        if data.email:
            existing = await CustomerRepository.get_by_email(db, data.email, tenant_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Customer with email '{data.email}' already exists",
                )
        customer = await CustomerRepository.create(db, tenant_id, data)
        await db.commit()
        await db.refresh(customer)
        return CustomerResponse.model_validate(customer)

    @staticmethod
    async def update_customer(
        db: AsyncSession,
        customer_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: CustomerUpdate,
    ) -> CustomerResponse:
        customer = await CustomerRepository.get_by_id(db, customer_id, tenant_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found"
            )
        # Check email uniqueness if email is being changed
        if data.email and data.email != customer.email:
            existing = await CustomerRepository.get_by_email(db, data.email, tenant_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Customer with email '{data.email}' already exists",
                )
        customer = await CustomerRepository.update(db, customer, data)
        await db.commit()
        return CustomerResponse.model_validate(customer)

    @staticmethod
    async def delete_customer(
        db: AsyncSession, customer_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        customer = await CustomerRepository.get_by_id(db, customer_id, tenant_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found"
            )
        await CustomerRepository.delete(db, customer)
        await db.commit()
