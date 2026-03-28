import asyncio
import uuid
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.domain.user import User, UserRole, Permission
from app.core.security import hash_password

async def ensure_admin():
    async with AsyncSessionLocal() as db:
        async with db.begin():
            # Find admin@demo.com
            result = await db.execute(select(User).where(User.email == "admin@demo.com"))
            admin = result.scalars().first()
            
            # If not exists, we need a tenant. We'll pick the first one or create one.
            from sqlalchemy import text
            tenant_res = await db.execute(text("SELECT id FROM tenants LIMIT 1"))
            tenant_id = tenant_res.scalar()
            
            if not tenant_id:
                tenant_id = uuid.uuid4()
                await db.execute(text("INSERT INTO tenants (id, name) VALUES (:id, :name)"), {"id": tenant_id, "name": "Demo Tenant"})
                print(f"Created new tenant: {tenant_id}")

            if admin:
                print(f"Updating existing user admin@demo.com (Role: SUPER_ADMIN, Pass: admin123)")
                admin.role = UserRole.SUPER_ADMIN
                admin.hashed_password = hash_password("admin123")
                admin.permissions = [p.value for p in Permission]
                admin.is_active = True
                admin.tenant_id = tenant_id # Ensure it belongs to a valid tenant
            else:
                print(f"Creating new user admin@demo.com (Role: SUPER_ADMIN, Pass: admin123)")
                new_admin = User(
                    id=uuid.uuid4(),
                    tenant_id=tenant_id,
                    email="admin@demo.com",
                    full_name="Administrator",
                    hashed_password=hash_password("admin123"),
                    role=UserRole.SUPER_ADMIN,
                    permissions=[p.value for p in Permission],
                    is_active=True
                )
                db.add(new_admin)

    print("Admin user setup complete.")

if __name__ == "__main__":
    asyncio.run(ensure_admin())
