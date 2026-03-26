import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.order import Order, PaymentStatus
from app.domain.payment import PaymentState
from app.repositories.payment_repo import PaymentRepository
from app.schemas.payment import (
    PaymentCreate,
    PaymentListResponse,
    PaymentResponse,
    PaymentUpdate,
)


class PaymentService:
    @staticmethod
    async def list_payments_for_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> list[PaymentResponse]:
        payments = await PaymentRepository.list_by_order(db, order_id, tenant_id)
        return [PaymentResponse.model_validate(p) for p in payments]

    @staticmethod
    async def get_payment(
        db: AsyncSession,
        payment_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> PaymentResponse:
        payment = await PaymentRepository.get_by_id(db, payment_id, tenant_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )
        return PaymentResponse.model_validate(payment)

    @staticmethod
    async def _recalculate_order_payment_status(
        db: AsyncSession,
        order: Order,
        tenant_id: uuid.UUID,
    ) -> None:
        total_paid = await PaymentRepository.get_total_paid_for_order(
            db, order.id, tenant_id
        )
        if total_paid >= float(order.total_amount):
            order.payment_status = PaymentStatus.PAID
        elif total_paid > 0:
            order.payment_status = PaymentStatus.PARTIAL
        else:
            order.payment_status = PaymentStatus.UNPAID
        await db.flush()

    @staticmethod
    async def create_payment(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: PaymentCreate,
    ) -> PaymentResponse:
        # Verify order exists and belongs to tenant
        result = await db.execute(
            select(Order).where(
                Order.id == data.order_id,
                Order.tenant_id == tenant_id,
            )
        )
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        payment = await PaymentRepository.create(db, tenant_id, data)

        # Recalculate order payment_status
        await PaymentService._recalculate_order_payment_status(db, order, tenant_id)

        await db.commit()
        await db.refresh(payment)
        return PaymentResponse.model_validate(payment)

    @staticmethod
    async def refund_payment(
        db: AsyncSession,
        payment_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> PaymentResponse:
        payment = await PaymentRepository.get_by_id(db, payment_id, tenant_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )

        # Fetch the associated order
        result = await db.execute(
            select(Order).where(
                Order.id == payment.order_id,
                Order.tenant_id == tenant_id,
            )
        )
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        update_data = PaymentUpdate(status=PaymentState.REFUNDED)
        payment = await PaymentRepository.update(db, payment, update_data)

        # Recalculate order payment_status after refund
        await PaymentService._recalculate_order_payment_status(db, order, tenant_id)

        await db.commit()
        await db.refresh(payment)
        return PaymentResponse.model_validate(payment)
