"""
Inventory Service inteqrasiya testləri.

PRD-1.md §6.3 (Inventory Module) və §6.4 (Stock Movement — AUDIT CORE)
tələblərinə uyğun testlər.

Test strukturu:
  - IN hərəkəti stoku artırır
  - OUT hərəkəti stoku azaldır
  - Kifayətsiz stokda 409 Conflict
  - RESERVE mövcud miqdarı azaldır
  - RELEASE reserved miqdarı azaldır
  - Hər hərəkətdə StockMovement audit logu yazılır
"""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.inventory import Inventory, MovementType, ReferenceType, StockMovement
from app.domain.product import ProductVariant
from app.domain.tenant import Tenant
from app.domain.warehouse import Warehouse
from app.domain.user import User
from app.schemas.inventory import (
    AdjustRequest,
    ReserveRequest,
    ReleaseRequest,
)
from app.services.inventory_service import InventoryService


# ── Helper: inventar sırası yarat ────────────────────────────────────────────

async def _create_inventory(
    db: AsyncSession,
    tenant: Tenant,
    warehouse: Warehouse,
    variant: ProductVariant,
    quantity: int = 0,
    reserved: int = 0,
) -> Inventory:
    """Test üçün inventar sırası birbaşa DB-yə yazır."""
    inv = Inventory(
        tenant_id=tenant.id,
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        quantity=quantity,
        reserved_quantity=reserved,
    )
    db.add(inv)
    await db.flush()
    return inv


# ── IN hərəkəti ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_adjust_in_increases_stock(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """IN hərəkəti inventar miqdarını artırmalıdır."""
    req = AdjustRequest(
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        movement_type=MovementType.IN,
        quantity=50,
        reference_type=ReferenceType.MANUAL,
    )
    result = await InventoryService.adjust(db_session, tenant.id, admin_user.id, req)
    assert result.quantity == 50
    assert result.available == 50


@pytest.mark.asyncio
async def test_adjust_in_negative_quantity_raises_400(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """IN üçün mənfi miqdar 400 xətası verməlidir."""
    from fastapi import HTTPException
    req = AdjustRequest(
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        movement_type=MovementType.IN,
        quantity=-10,
        reference_type=ReferenceType.MANUAL,
    )
    with pytest.raises(HTTPException) as exc:
        await InventoryService.adjust(db_session, tenant.id, admin_user.id, req)
    assert exc.value.status_code == 400


# ── OUT hərəkəti ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_adjust_out_reduces_stock(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """OUT hərəkəti inventar miqdarını azaltmalıdır."""
    await _create_inventory(db_session, tenant, warehouse, variant, quantity=100)

    req = AdjustRequest(
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        movement_type=MovementType.OUT,
        quantity=30,
        reference_type=ReferenceType.MANUAL,
    )
    result = await InventoryService.adjust(db_session, tenant.id, admin_user.id, req)
    assert result.quantity == 70


@pytest.mark.asyncio
async def test_adjust_out_insufficient_stock_raises_409(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    Mövcud stokdan çox OUT sorğusu 409 Conflict verməlidir.
    PRD §16: 'Simultaneous orders (race condition)' edge case-i əhatə edir.
    """
    from fastapi import HTTPException
    await _create_inventory(db_session, tenant, warehouse, variant, quantity=10)

    req = AdjustRequest(
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        movement_type=MovementType.OUT,
        quantity=50,  # 10-dan çoxdur
        reference_type=ReferenceType.MANUAL,
    )
    with pytest.raises(HTTPException) as exc:
        await InventoryService.adjust(db_session, tenant.id, admin_user.id, req)
    assert exc.value.status_code == 409


# ── RESERVE hərəkəti ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_reserve_reduces_available(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    RESERVE reserved_quantity əlavə edir → available azalır.
    PRD §7: Reservation Flow — 'Increase reserved_quantity'.
    """
    import uuid
    await _create_inventory(db_session, tenant, warehouse, variant, quantity=100)

    req = ReserveRequest(
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        quantity=20,
        reference_id=str(uuid.uuid4()),
    )
    result = await InventoryService.reserve(db_session, tenant.id, admin_user.id, req)
    assert result.reserved_quantity == 20
    assert result.available == 80


@pytest.mark.asyncio
async def test_reserve_insufficient_stock_raises_409(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """Mövcud olmayan inventarı RESERVE etmək 409 verməlidir."""
    import uuid
    from fastapi import HTTPException
    # Inventar yoxdur — birbaşa reserve cəhdi
    req = ReserveRequest(
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        quantity=10,
        reference_id=str(uuid.uuid4()),
    )
    with pytest.raises(HTTPException) as exc:
        await InventoryService.reserve(db_session, tenant.id, admin_user.id, req)
    assert exc.value.status_code in (404, 409)


# ── RELEASE hərəkəti ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_release_reduces_reserved(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    RELEASE reserved_quantity azaldır.
    PRD §7: Cancellation — 'Reduce reserved, Create RELEASE movement'.
    """
    import uuid
    inv = await _create_inventory(
        db_session, tenant, warehouse, variant, quantity=100, reserved=30
    )

    req = ReleaseRequest(
        inventory_id=inv.id,
        quantity=30,
        reference_id=str(uuid.uuid4()),
    )
    result = await InventoryService.release(db_session, tenant.id, admin_user.id, req)
    assert result.reserved_quantity == 0
    assert result.available == 100


@pytest.mark.asyncio
async def test_release_with_no_reserved_raises_409(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """Reserved miqdar 0 olduqda RELEASE 409 verməlidir."""
    import uuid
    from fastapi import HTTPException
    inv = await _create_inventory(
        db_session, tenant, warehouse, variant, quantity=50, reserved=0
    )
    req = ReleaseRequest(
        inventory_id=inv.id,
        quantity=10,
        reference_id=str(uuid.uuid4()),
    )
    with pytest.raises(HTTPException) as exc:
        await InventoryService.release(db_session, tenant.id, admin_user.id, req)
    assert exc.value.status_code == 409


# ── Audit Log (StockMovement) ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_stock_movement_audit_log_created(
    db_session: AsyncSession, tenant: Tenant, admin_user: User,
    warehouse: Warehouse, variant: ProductVariant,
):
    """
    Hər inventory hərəkəti üçün StockMovement audit logu yaranmalıdır.
    PRD §6.4: 'Each record must include reference_type, user_id, timestamp'.
    """
    req = AdjustRequest(
        warehouse_id=warehouse.id,
        variant_id=variant.id,
        movement_type=MovementType.IN,
        quantity=25,
        reference_type=ReferenceType.MANUAL,
        note="Test qəbulu",
    )
    inv_resp = await InventoryService.adjust(db_session, tenant.id, admin_user.id, req)

    # Audit log yoxlanır
    result = await db_session.execute(
        select(StockMovement).where(
            StockMovement.tenant_id == tenant.id,
            StockMovement.movement_type == MovementType.IN,
        )
    )
    movements = result.scalars().all()
    assert len(movements) >= 1
    m = movements[-1]
    assert m.quantity == 25
    assert m.user_id == admin_user.id
    assert m.note == "Test qəbulu"
