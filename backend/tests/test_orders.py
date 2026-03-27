"""
Order Service inteqrasiya testləri.

PRD-1.md §6.5 (Order Module) — Order state machine testləri:
  draft → confirmed → [processing] → shipped → delivered
  draft/confirmed/processing → cancelled

Test strukturu:
  - Sifariş yaradıldıqda stok rezerv edilir
  - Stok çatışmazlıqda 409
  - DRAFT → CONFIRMED keçidi
  - Ləğv — stok buraxılır (RELEASE)
  - Göndərmə — stok azalır (OUT)
  - DELIVERED son statusdur
  - Göndərilmiş sifarişi ləğv etmək mümkün deyil
"""

import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.inventory import Inventory, MovementType, StockMovement
from app.domain.order import OrderStatus
from app.domain.product import ProductVariant
from app.domain.tenant import Tenant
from app.domain.user import User
from app.domain.warehouse import Warehouse
from app.schemas.order import OrderCreate, OrderItemCreate
from app.services.order_service import OrderService


# ── Helper: inventar yarat ────────────────────────────────────────────────────

async def _seed_inventory(
    db: AsyncSession,
    tenant: Tenant,
    warehouse: Warehouse,
    variant: ProductVariant,
    quantity: int = 100,
) -> Inventory:
    inv = Inventory(
        tenant_id=tenant.id,
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        quantity=quantity,
        reserved_quantity=0,
    )
    db.add(inv)
    await db.flush()
    return inv


def _order_payload(
    warehouse_id: uuid.UUID,
    variant_id: uuid.UUID,
    qty: int = 5,
) -> OrderCreate:
    return OrderCreate(
        warehouse_id=warehouse_id,
        items=[OrderItemCreate(variant_id=variant_id, quantity=qty, unit_price=10.0)],
        currency="AZN",
    )


# ── Sifariş yaratma ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_order_reserves_stock(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    Sifariş yaradıldıqda inventardakı reserved_quantity artmalıdır.
    PRD §7: Reservation Flow — 'Increase reserved_quantity, Create RESERVE movement'.
    """
    await _seed_inventory(db_session, tenant, warehouse, variant, quantity=50)

    data = _order_payload(warehouse.id, variant.id, qty=5)
    order = await OrderService.create_order(db_session, tenant.id, admin_user.id, data)

    assert order.status == OrderStatus.DRAFT

    inv_result = await db_session.execute(
        select(Inventory).where(
            Inventory.tenant_id == tenant.id,
            Inventory.warehouse_id == warehouse.id,
            Inventory.variant_id == variant.id,
        )
    )
    inv = inv_result.scalar_one()
    assert inv.reserved_quantity == 5
    assert inv.available == 45


@pytest.mark.asyncio
async def test_create_order_insufficient_stock_raises_409(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    Stok kifayət etmədikdə sifariş 409 Conflict verməlidir.
    PRD §16: Critical Edge Cases — 'Simultaneous orders (race condition)'.
    """
    from fastapi import HTTPException
    await _seed_inventory(db_session, tenant, warehouse, variant, quantity=3)

    data = _order_payload(warehouse.id, variant.id, qty=10)
    with pytest.raises(HTTPException) as exc:
        await OrderService.create_order(db_session, tenant.id, admin_user.id, data)
    assert exc.value.status_code == 409


# ── Status keçidləri ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_confirm_order_changes_status_to_confirmed(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """DRAFT → CONFIRMED keçidi uğurlu olmalıdır."""
    await _seed_inventory(db_session, tenant, warehouse, variant, quantity=50)
    order = await OrderService.create_order(
        db_session, tenant.id, admin_user.id,
        _order_payload(warehouse.id, variant.id, qty=5)
    )

    confirmed = await OrderService.confirm_order(
        db_session, order.id, tenant.id, admin_user.id
    )
    assert confirmed.status == OrderStatus.CONFIRMED


@pytest.mark.asyncio
async def test_cancel_order_releases_reserved_stock(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    Sifariş ləğv edildikdə rezerv edilmiş stok buraxılmalıdır.
    PRD §7: Cancellation — 'Reduce reserved, Create RELEASE movement'.
    """
    await _seed_inventory(db_session, tenant, warehouse, variant, quantity=50)
    order = await OrderService.create_order(
        db_session, tenant.id, admin_user.id,
        _order_payload(warehouse.id, variant.id, qty=5)
    )

    cancelled = await OrderService.cancel_order(
        db_session, order.id, tenant.id, admin_user.id
    )
    assert cancelled.status == OrderStatus.CANCELLED

    inv_result = await db_session.execute(
        select(Inventory).where(
            Inventory.tenant_id == tenant.id,
            Inventory.warehouse_id == warehouse.id,
            Inventory.variant_id == variant.id,
        )
    )
    inv = inv_result.scalar_one()
    assert inv.reserved_quantity == 0


@pytest.mark.asyncio
async def test_ship_order_deducts_stock_and_creates_out_movement(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    Göndərmə zamanı quantity azalır və OUT hərəkəti yazılır.
    PRD §7: Payment Confirmation — 'Reduce quantity, Create OUT movement'.
    """
    await _seed_inventory(db_session, tenant, warehouse, variant, quantity=50)

    order = await OrderService.create_order(
        db_session, tenant.id, admin_user.id,
        _order_payload(warehouse.id, variant.id, qty=5)
    )
    await OrderService.confirm_order(db_session, order.id, tenant.id, admin_user.id)
    shipped = await OrderService.ship_order(db_session, order.id, tenant.id, admin_user.id)
    assert shipped.status == OrderStatus.SHIPPED

    inv_result = await db_session.execute(
        select(Inventory).where(
            Inventory.tenant_id == tenant.id,
            Inventory.warehouse_id == warehouse.id,
            Inventory.variant_id == variant.id,
        )
    )
    inv = inv_result.scalar_one()
    assert inv.quantity == 45        # 50 - 5
    assert inv.reserved_quantity == 0

    # OUT hərəkəti audit log-da olmalıdır
    mv_result = await db_session.execute(
        select(StockMovement).where(
            StockMovement.tenant_id == tenant.id,
            StockMovement.movement_type == MovementType.OUT,
        )
    )
    out_mvs = mv_result.scalars().all()
    assert len(out_mvs) >= 1


@pytest.mark.asyncio
async def test_deliver_order_changes_status_to_delivered(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """SHIPPED → DELIVERED keçidi uğurlu olmalıdır."""
    await _seed_inventory(db_session, tenant, warehouse, variant, quantity=50)

    order = await OrderService.create_order(
        db_session, tenant.id, admin_user.id,
        _order_payload(warehouse.id, variant.id, qty=5)
    )
    await OrderService.confirm_order(db_session, order.id, tenant.id, admin_user.id)
    await OrderService.ship_order(db_session, order.id, tenant.id, admin_user.id)
    delivered = await OrderService.deliver_order(db_session, order.id, tenant.id)

    assert delivered.status == OrderStatus.DELIVERED


@pytest.mark.asyncio
async def test_cancel_shipped_order_raises_400(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    Göndərilmiş (SHIPPED) sifarişin ləğvi mümkün deyil — 400 Bad Request.
    PRD Order States: shipped statusdan cancel keçidi yoxdur.
    """
    from fastapi import HTTPException
    await _seed_inventory(db_session, tenant, warehouse, variant, quantity=50)

    order = await OrderService.create_order(
        db_session, tenant.id, admin_user.id,
        _order_payload(warehouse.id, variant.id, qty=5)
    )
    await OrderService.confirm_order(db_session, order.id, tenant.id, admin_user.id)
    await OrderService.ship_order(db_session, order.id, tenant.id, admin_user.id)

    with pytest.raises(HTTPException) as exc:
        await OrderService.cancel_order(db_session, order.id, tenant.id, admin_user.id)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_cannot_update_non_draft_order(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """Yalnız DRAFT statuslu sifarişlər yenilənə bilər."""
    from fastapi import HTTPException
    from app.schemas.order import OrderUpdate
    await _seed_inventory(db_session, tenant, warehouse, variant, quantity=50)

    order = await OrderService.create_order(
        db_session, tenant.id, admin_user.id,
        _order_payload(warehouse.id, variant.id, qty=5)
    )
    await OrderService.confirm_order(db_session, order.id, tenant.id, admin_user.id)

    with pytest.raises(HTTPException) as exc:
        await OrderService.update_order(
            db_session, order.id, tenant.id, OrderUpdate(notes="dəyişiklik")
        )
    assert exc.value.status_code == 400
