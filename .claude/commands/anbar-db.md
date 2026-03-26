---
name: anbar-db
description: ANBAR database əməliyyatları — migration, seed, monitoring, backup
---

ANBAR PostgreSQL idarəetmə əmrləri:

## Migration Əməliyyatları

1. **Migration statusu göstər**: `docker exec anbar_backend alembic current`
2. **Bütün migrationları tətbiq et**: `docker exec anbar_backend alembic upgrade head`
3. **Yeni migration yarat (autogenerate)**: `docker exec anbar_backend alembic revision --autogenerate -m "$ARGUMENTS"`
4. **Son migrationi geri al**: `docker exec anbar_backend alembic downgrade -1`
5. **Migration tarixçəsini göstər**: `docker exec anbar_backend alembic history --verbose`
6. **Müəyyən revision-a get**: `docker exec anbar_backend alembic upgrade <revision_id>`

> ⚠️ Mövcud migration fayllarını heç vaxt dəyiş — həmişə yeni migration yarat.

## Database Bağlantısı

1. **psql shell aç**: `docker exec -it anbar_postgres psql -U anbar_user -d anbar_dev`
2. **Bağlantı yoxla**: `docker exec anbar_postgres pg_isready -U anbar_user -d anbar_dev`
3. **Cədvəl siyahısı**: `docker exec anbar_postgres psql -U anbar_user -d anbar_dev -c "\dt"`
4. **Cədvəl strukturu**: `docker exec anbar_postgres psql -U anbar_user -d anbar_dev -c "\d tablename"`

## Monitoring

1. **Inventory qalığı yoxla**:
   ```
   docker exec anbar_postgres psql -U anbar_user -d anbar_dev -c \
   "SELECT variant_id, quantity, reserved_quantity, quantity-reserved_quantity AS available FROM inventory;"
   ```
2. **Son stock movements**:
   ```
   docker exec anbar_postgres psql -U anbar_user -d anbar_dev -c \
   "SELECT movement_type, quantity, reference_type, created_at FROM stock_movements ORDER BY created_at DESC LIMIT 20;"
   ```
3. **Aktiv tenantlar**:
   ```
   docker exec anbar_postgres psql -U anbar_user -d anbar_dev -c \
   "SELECT id, name, slug, is_active FROM tenants;"
   ```
4. **User statistikası**:
   ```
   docker exec anbar_postgres psql -U anbar_user -d anbar_dev -c \
   "SELECT role, COUNT(*) FROM users GROUP BY role;"
   ```

## Seed / Test Data

1. **İlk admin user yarat** (migrationdan sonra):
   ```
   docker exec anbar_backend python -c "
   import asyncio
   from app.core.database import AsyncSessionLocal
   from app.domain.tenant import Tenant
   from app.domain.user import User, UserRole
   from app.core.security import hash_password
   import uuid

   async def seed():
       async with AsyncSessionLocal() as db:
           tenant = Tenant(name='Demo Company', slug='demo')
           db.add(tenant)
           await db.flush()
           user = User(
               tenant_id=tenant.id,
               email='admin@demo.com',
               hashed_password=hash_password('admin123'),
               full_name='Admin User',
               role=UserRole.ORG_ADMIN
           )
           db.add(user)
           await db.commit()
           print(f'Tenant: {tenant.id}')
           print(f'User: admin@demo.com / admin123')

   asyncio.run(seed())
   "
   ```

## Backup / Restore

1. **Database backup al**: `docker exec anbar_postgres pg_dump -U anbar_user anbar_dev > anbar_backup_$(date +%Y%m%d_%H%M%S).sql`
2. **Backup restore et**: `docker exec -i anbar_postgres psql -U anbar_user -d anbar_dev < backup_file.sql`
3. **Schema-only backup**: `docker exec anbar_postgres pg_dump -U anbar_user --schema-only anbar_dev > schema.sql`

## Troubleshooting

1. **DB container restart**: `docker compose restart postgres`
2. **Volume-u sil (data itir!) və yenidən başlat**: `docker compose down && docker volume rm anbar_postgres_data && docker compose up -d`
3. **Aktiv əlaqələri göstər**: `docker exec anbar_postgres psql -U anbar_user -d anbar_dev -c "SELECT pid, usename, application_name, state FROM pg_stat_activity WHERE datname = 'anbar_dev';"`
