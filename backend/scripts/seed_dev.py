"""
Dev seed script — ilk tenant, admin user, warehouse, product və inventory yaradır.
Usage: docker exec anbar_backend python scripts/seed_dev.py
"""
import asyncio
import uuid

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.domain.inventory import Inventory, MovementType, ReferenceType, StockMovement
from app.domain.product import Category, Product, ProductVariant
from app.domain.tenant import Tenant
from app.domain.user import User, UserRole
from app.domain.warehouse import Warehouse


async def seed():
    async with AsyncSessionLocal() as db:
        # ── Mövcud seed yoxla ────────────────────────────────────────
        existing = await db.execute(select(Tenant).where(Tenant.slug == "demo"))
        if existing.scalar_one_or_none():
            print("⚠️  Seed artıq mövcuddur (slug=demo). Keçildi.")
            return

        # ── Tenant ───────────────────────────────────────────────────
        tenant = Tenant(
            id=uuid.uuid4(),
            name="Demo Şirkət",
            slug="demo",
        )
        db.add(tenant)
        await db.flush()

        # ── Users ────────────────────────────────────────────────────
        admin = User(
            tenant_id=tenant.id,
            email="admin@demo.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin İstifadəçi",
            role=UserRole.ORG_ADMIN,
        )
        warehouse_mgr = User(
            tenant_id=tenant.id,
            email="warehouse@demo.com",
            hashed_password=hash_password("warehouse123"),
            full_name="Anbar Meneceri",
            role=UserRole.WAREHOUSE_MANAGER,
        )
        db.add_all([admin, warehouse_mgr])
        await db.flush()

        # ── Category ─────────────────────────────────────────────────
        category = Category(
            tenant_id=tenant.id,
            name="Elektronika",
        )
        db.add(category)
        await db.flush()

        # ── Warehouse ────────────────────────────────────────────────
        warehouse = Warehouse(
            tenant_id=tenant.id,
            name="Mərkəzi Anbar",
            address="Bakı, Azərbaycan",
        )
        db.add(warehouse)
        await db.flush()

        # ── Products + Variants ──────────────────────────────────────
        product1 = Product(
            tenant_id=tenant.id,
            category_id=category.id,
            name="Laptop ProBook",
            sku="LAPTOP-001",
            description="15.6 düym, 16GB RAM, 512GB SSD",
        )
        db.add(product1)
        await db.flush()

        variant1 = ProductVariant(
            tenant_id=tenant.id,
            product_id=product1.id,
            sku="LAPTOP-001-BLK",
            name="Laptop ProBook - Qara",
            price=1299.99,
            attributes='{"color": "black"}',
        )
        variant2 = ProductVariant(
            tenant_id=tenant.id,
            product_id=product1.id,
            sku="LAPTOP-001-SLV",
            name="Laptop ProBook - Gümüşü",
            price=1299.99,
            attributes='{"color": "silver"}',
        )
        db.add_all([variant1, variant2])
        await db.flush()

        # ── Inventory + StockMovement (IN) ───────────────────────────
        inv1 = Inventory(
            tenant_id=tenant.id,
            warehouse_id=warehouse.id,
            variant_id=variant1.id,
            quantity=50,
            reserved_quantity=0,
        )
        inv2 = Inventory(
            tenant_id=tenant.id,
            warehouse_id=warehouse.id,
            variant_id=variant2.id,
            quantity=30,
            reserved_quantity=0,
        )
        db.add_all([inv1, inv2])
        await db.flush()

        # Stock movements — ilkin stok daxilolma
        movement1 = StockMovement(
            tenant_id=tenant.id,
            inventory_id=inv1.id,
            movement_type=MovementType.IN,
            quantity=50,
            reference_type=ReferenceType.MANUAL,
            reference_id="SEED",
            user_id=admin.id,
            note="İlkin stok yükləməsi",
        )
        movement2 = StockMovement(
            tenant_id=tenant.id,
            inventory_id=inv2.id,
            movement_type=MovementType.IN,
            quantity=30,
            reference_type=ReferenceType.MANUAL,
            reference_id="SEED",
            user_id=admin.id,
            note="İlkin stok yükləməsi",
        )
        db.add_all([movement1, movement2])

        await db.commit()

        print("✅ Seed tamamlandı!")
        print()
        print("── Tenant ──────────────────────────────")
        print(f"   ID:   {tenant.id}")
        print(f"   Adı:  {tenant.name} (slug: {tenant.slug})")
        print()
        print("── İstifadəçilər ───────────────────────")
        print(f"   admin@demo.com       / admin123      (ORG_ADMIN)")
        print(f"   warehouse@demo.com   / warehouse123  (WAREHOUSE_MANAGER)")
        print()
        print("── Anbar ───────────────────────────────")
        print(f"   {warehouse.name}  (ID: {warehouse.id})")
        print()
        print("── Məhsullar ───────────────────────────")
        print(f"   {product1.name} ({product1.sku})")
        print(f"   └─ {variant1.name} — 50 ədəd stokda")
        print(f"   └─ {variant2.name} — 30 ədəd stokda")
        print()
        print("── API Endpoints ───────────────────────")
        print("   POST http://localhost:8090/api/v1/auth/login")
        print("   GET  http://localhost:8090/api/docs")


if __name__ == "__main__":
    asyncio.run(seed())
