import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.domain.user import User, UserRole
from app.schemas.payment import PaymentCreate, PaymentListResponse, PaymentResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=PaymentListResponse, summary="Bütün ödənişlərin siyahısı")
async def list_all_payments(
    order_id: Optional[uuid.UUID] = Query(None, description="Filtr: Sifariş ID-si"),
    payment_method: Optional[str] = Query(None, description="Filtr: ödəniş üsulu"),
    page: int = Query(1, ge=1, description="Səhifə nömrəsi"),
    per_page: int = Query(20, ge=1, le=100, description="Səhifə başına nəticə sayı"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bütün tenant-ın ödənişlərini qaytarır. Sifariş və ödəniş üsuluna görə filtrasiya mümkündür."""
    return await PaymentService.list_all_payments(
        db,
        tenant_id=current_user.tenant_id,
        order_id=order_id,
        payment_method=payment_method,
        page=page,
        per_page=per_page,
    )


@router.get("/order/{order_id}", response_model=list[PaymentResponse])
async def list_payments_for_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PaymentService.list_payments_for_order(
        db, order_id, current_user.tenant_id
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PaymentService.get_payment(db, payment_id, current_user.tenant_id)


@router.post("", response_model=PaymentResponse, status_code=201)
async def create_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.SALES_MANAGER, UserRole.ORG_ADMIN)
    ),
):
    return await PaymentService.create_payment(db, current_user.tenant_id, data)


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
async def refund_payment(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN)),
):
    return await PaymentService.refund_payment(db, payment_id, current_user.tenant_id)
