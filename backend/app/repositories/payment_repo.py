import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.payment import Payment, PaymentState
from app.schemas.payment import PaymentCreate, PaymentUpdate


class PaymentRepository:
    @staticmethod
    async def list_by_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> list[Payment]:
        result = await db.execute(
            select(Payment)
            .where(
                Payment.order_id == order_id,
                Payment.tenant_id == tenant_id,
            )
            .order_by(Payment.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        payment_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> Optional[Payment]:
        result = await db.execute(
            select(Payment).where(
                Payment.id == payment_id,
                Payment.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: PaymentCreate,
    ) -> Payment:
        now = datetime.now(timezone.utc)
        payment = Payment(
            tenant_id=tenant_id,
            order_id=data.order_id,
            amount=data.amount,
            payment_method=data.payment_method,
            status=PaymentState.COMPLETED,
            external_payment_id=data.external_payment_id,
            paid_at=now,
            notes=data.notes,
        )
        db.add(payment)
        await db.flush()
        await db.refresh(payment)
        return payment

    @staticmethod
    async def update(
        db: AsyncSession,
        payment: Payment,
        data: PaymentUpdate,
    ) -> Payment:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(payment, field, value)
        if data.status == PaymentState.COMPLETED and payment.paid_at is None:
            payment.paid_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(payment)
        return payment

    @staticmethod
    async def get_total_paid_for_order(
        db: AsyncSession,
        order_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> float:
        result = await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.order_id == order_id,
                Payment.tenant_id == tenant_id,
                Payment.status == PaymentState.COMPLETED,
            )
        )
        return float(result.scalar_one())
