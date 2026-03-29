import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permissions
from app.core.database import get_db
from app.domain.user import Permission, User
from app.schemas.customer import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=CustomerListResponse, summary="Müştəri siyahısı")
async def list_customers(
    page: int = Query(1, ge=1, description="Səhifə nömrəsi"),
    per_page: int = Query(20, ge=1, le=100, description="Səhifədəki element sayı"),
    is_active: Optional[bool] = Query(None, description="Filtr: Aktivlik statusu"),
    search: Optional[str] = Query(None, max_length=255, description="Axtarış (Ad, Email)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.CUSTOMERS_READ)),
):
    """Bütün müştərilərin siyahısını pagination və axtarış ilə qaytarır."""
    return await CustomerService.list_customers(
        db, current_user.tenant_id, page, per_page, is_active, search
    )


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.CUSTOMERS_WRITE)),
):
    return await CustomerService.create_customer(db, current_user.tenant_id, data)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.CUSTOMERS_READ)),
):
    return await CustomerService.get_customer(db, customer_id, current_user.tenant_id)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.CUSTOMERS_WRITE)),
):
    return await CustomerService.update_customer(
        db, customer_id, current_user.tenant_id, data
    )


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.CUSTOMERS_MANAGE)),
):
    await CustomerService.delete_customer(db, customer_id, current_user.tenant_id)
