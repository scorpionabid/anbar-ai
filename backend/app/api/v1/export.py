import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.domain.inventory import Inventory
from app.domain.order import Order
from app.domain.product import Product, ProductVariant
from app.domain.user import User

router = APIRouter(prefix="/export", tags=["export"])


def _make_streaming_response(output: io.StringIO, filename: str) -> StreamingResponse:
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@router.get("/products", summary="Məhsulları CSV-ə ixrac et")
async def export_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bütün məhsulları və variantları CSV formatında qaytarır (Excel uyğun UTF-8 BOM)."""
    tenant_id = current_user.tenant_id

    result = await db.execute(
        select(Product)
        .options(
            joinedload(Product.variants),
            joinedload(Product.category),
        )
        .where(Product.tenant_id == tenant_id)
        .order_by(Product.name)
    )
    products = list(result.scalars().unique().all())

    output = io.StringIO()
    output.write("\ufeff")  # BOM for Excel UTF-8 compatibility

    writer = csv.writer(output)
    writer.writerow(["SKU", "Məhsul adı", "Variant adı", "Kateqoriya", "Qiymət", "Maya dəyəri", "Ştrix kod", "Çəki"])

    for product in products:
        category_name = product.category.name if product.category else ""
        if product.variants:
            for variant in product.variants:
                writer.writerow([
                    variant.sku or "",
                    product.name,
                    variant.name,
                    category_name,
                    float(variant.price) if variant.price is not None else 0,
                    float(variant.cost_price) if variant.cost_price is not None else "",
                    variant.barcode or "",
                    float(variant.weight) if variant.weight is not None else "",
                ])
        else:
            writer.writerow([
                product.sku,
                product.name,
                "",
                category_name,
                "",
                "",
                "",
                "",
            ])

    return _make_streaming_response(output, "products.csv")


@router.get("/inventory", summary="İnventarı CSV-ə ixrac et")
async def export_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bütün inventar qeydlərini CSV formatında qaytarır (Excel uyğun UTF-8 BOM)."""
    tenant_id = current_user.tenant_id

    from app.domain.warehouse import Warehouse

    result = await db.execute(
        select(Inventory)
        .options(
            joinedload(Inventory.variant).joinedload(ProductVariant.product),
            joinedload(Inventory.warehouse),
        )
        .where(Inventory.tenant_id == tenant_id)
        .order_by(Inventory.created_at)
    )
    inventory_rows = list(result.scalars().unique().all())

    output = io.StringIO()
    output.write("\ufeff")

    writer = csv.writer(output)
    writer.writerow(["SKU", "Variant", "Anbar", "Əldə olan", "Rezerv", "Mövcud", "Gözlənilən", "Yenidən sifariş hədd"])

    for inv in inventory_rows:
        variant = inv.variant
        sku = variant.sku if variant else ""
        variant_name = variant.name if variant else ""
        warehouse_name = inv.warehouse.name if inv.warehouse else ""
        writer.writerow([
            sku,
            variant_name,
            warehouse_name,
            inv.quantity,
            inv.reserved_quantity,
            inv.available,
            inv.incoming_quantity,
            inv.reorder_point,
        ])

    return _make_streaming_response(output, "inventory.csv")


@router.get("/orders", summary="Sifarişləri CSV-ə ixrac et")
async def export_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bütün sifarişləri CSV formatında qaytarır (Excel uyğun UTF-8 BOM)."""
    tenant_id = current_user.tenant_id

    from app.domain.customer import Customer

    result = await db.execute(
        select(Order)
        .options(joinedload(Order.customer))
        .where(Order.tenant_id == tenant_id)
        .order_by(Order.created_at.desc())
    )
    orders = list(result.scalars().unique().all())

    output = io.StringIO()
    output.write("\ufeff")

    writer = csv.writer(output)
    writer.writerow(["Sifariş ID", "Tarix", "Müştəri", "Status", "Ödəniş statusu", "Məbləğ"])

    for order in orders:
        customer_name = order.customer.name if order.customer else ""
        writer.writerow([
            str(order.id)[:8],
            order.created_at.strftime("%d.%m.%Y %H:%M") if order.created_at else "",
            customer_name,
            order.status.value,
            order.payment_status.value,
            float(order.total_amount) if order.total_amount is not None else 0,
        ])

    return _make_streaming_response(output, "orders.csv")
