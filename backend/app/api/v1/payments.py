import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.domain.user import User, UserRole
from app.schemas.payment import PaymentCreate, PaymentListResponse, PaymentResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


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
