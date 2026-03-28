import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
            .options(selectinload(Payment.order))
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        payment_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> Optional[Payment]:
        result = await db.execute(
            select(Payment)
            .where(
                Payment.id == payment_id,
                Payment.tenant_id == tenant_id,
            )
            .options(selectinload(Payment.order))
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
    async def list_all(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        order_id: Optional[uuid.UUID] = None,
        payment_method: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Payment], int]:
        base_filters = [Payment.tenant_id == tenant_id]
        if order_id is not None:
            base_filters.append(Payment.order_id == order_id)
        if payment_method is not None:
            base_filters.append(Payment.payment_method == payment_method)

        count_result = await db.execute(
            select(func.count()).select_from(Payment).where(*base_filters)
        )
        total = count_result.scalar_one()

        data_result = await db.execute(
            select(Payment)
            .where(*base_filters)
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(selectinload(Payment.order))
        )
        payments = list(data_result.scalars().all())
        return payments, total

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
