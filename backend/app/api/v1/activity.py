from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import require_permissions
from app.core.database import get_db
from app.domain.inventory import StockMovement
from app.domain.order import Order
from app.domain.purchase_order import PurchaseOrder
from app.domain.user import Permission, User
from app.schemas.activity import ActivityItem, ActivityType

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("", summary="Aktivlik jurnalı")
async def get_activity(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.REPORTS_VIEW)),
):
    """
    Son aktivlikləri qaytarır: stok hərəkətləri, sifarişlər, alış sifarişləri.
    Nəticə created_at-a görə azalan sırada sıralanır.
    """
    tenant_id = current_user.tenant_id

    # --- StockMovements: inventory → variant → product join ---
    sm_result = await db.execute(
        select(StockMovement)
        .options(
            joinedload(StockMovement.inventory)
        )
        .where(StockMovement.tenant_id == tenant_id)
        .order_by(StockMovement.created_at.desc())
        .limit(limit)
    )
    stock_movements = list(sm_result.scalars().unique().all())

    # Variant names: collect variant_ids from loaded inventory rows
    from app.domain.product import ProductVariant
    variant_ids = {sm.inventory.variant_id for sm in stock_movements if sm.inventory}
    variant_map: dict = {}
    if variant_ids:
        vr = await db.execute(
            select(ProductVariant).where(ProductVariant.id.in_(variant_ids))
        )
        variant_map = {v.id: v.name for v in vr.scalars().all()}

    # Warehouse names
    from app.domain.warehouse import Warehouse
    warehouse_ids = {sm.inventory.warehouse_id for sm in stock_movements if sm.inventory}
    warehouse_map: dict = {}
    if warehouse_ids:
        wr = await db.execute(
            select(Warehouse).where(Warehouse.id.in_(warehouse_ids))
        )
        warehouse_map = {w.id: w.name for w in wr.scalars().all()}

    # --- Orders ---
    ord_result = await db.execute(
        select(Order)
        .where(Order.tenant_id == tenant_id)
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    orders = list(ord_result.scalars().all())

    from app.domain.customer import Customer
    customer_ids = {o.customer_id for o in orders if o.customer_id}
    customer_map: dict = {}
    if customer_ids:
        cr = await db.execute(
            select(Customer).where(Customer.id.in_(customer_ids))
        )
        customer_map = {c.id: c.name for c in cr.scalars().all()}

    # --- PurchaseOrders ---
    po_result = await db.execute(
        select(PurchaseOrder)
        .where(PurchaseOrder.tenant_id == tenant_id)
        .order_by(PurchaseOrder.created_at.desc())
        .limit(limit)
    )
    purchase_orders = list(po_result.scalars().all())

    from app.domain.supplier import Supplier
    supplier_ids = {po.supplier_id for po in purchase_orders if po.supplier_id}
    supplier_map: dict = {}
    if supplier_ids:
        sr = await db.execute(
            select(Supplier).where(Supplier.id.in_(supplier_ids))
        )
        supplier_map = {s.id: s.name for s in sr.scalars().all()}

    # --- Build ActivityItems ---
    items: list[ActivityItem] = []

    for sm in stock_movements:
        inv = sm.inventory
        variant_name = variant_map.get(inv.variant_id, "Məhsul") if inv else "Məhsul"
        warehouse_name = warehouse_map.get(inv.warehouse_id, "") if inv else ""
        items.append(ActivityItem(
            id=f"sm_{sm.id}",
            type=ActivityType.STOCK_MOVEMENT,
            description=f"Stok hərəkəti: {sm.movement_type.value} — {variant_name} ({sm.quantity} ədəd)",
            timestamp=sm.created_at,
            metadata={
                "movement_type": sm.movement_type.value,
                "quantity": sm.quantity,
                "warehouse": warehouse_name,
                "variant_id": str(inv.variant_id) if inv else None,
            },
        ))

    for order in orders:
        customer_name = customer_map.get(order.customer_id, "Müştəri") if order.customer_id else "Müştəri"
        items.append(ActivityItem(
            id=f"ord_{order.id}",
            type=ActivityType.ORDER,
            description=f"Sifariş #{str(order.id)[:8]}: {order.status.value} — {customer_name}",
            timestamp=order.created_at,
            metadata={
                "status": order.status.value,
                "total_amount": float(order.total_amount),
                "customer_id": str(order.customer_id) if order.customer_id else None,
                "order_number": order.order_number,
            },
        ))

    for po in purchase_orders:
        supplier_name = supplier_map.get(po.supplier_id, "Təchizatçı") if po.supplier_id else "Təchizatçı"
        items.append(ActivityItem(
            id=f"po_{po.id}",
            type=ActivityType.PURCHASE_ORDER,
            description=f"Alış #{str(po.id)[:8]}: {po.status.value} — {supplier_name}",
            timestamp=po.created_at,
            metadata={
                "status": po.status.value,
                "total_amount": float(po.total_amount),
                "supplier_id": str(po.supplier_id) if po.supplier_id else None,
                "po_number": po.po_number,
            },
        ))

    # Sort all merged items by timestamp descending, return first {limit}
    items.sort(key=lambda x: x.timestamp, reverse=True)
    items = items[:limit]

    return {"data": [item.model_dump() for item in items], "message": "ok"}
