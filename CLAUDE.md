# CLAUDE.md — ANBAR

Bu fayl Claude Code-a ANBAR layihəsində işləmək üçün tam kontekst verir.

---

## Layihə Xülasəsi

**ANBAR** — Enterprise-grade Inventory & Sales Core Platform
Multi-tenant, API-first, ERP-lite + Marketplace Core (SaaS-ready)

| Layer | Tech |
|---|---|
| Backend | FastAPI 0.115 · Python 3.12 · Clean Architecture |
| Frontend | Next.js 15 · TypeScript · React Query · Zustand |
| Database | PostgreSQL 16 (row-level multi-tenancy via `tenant_id`) |
| Queue | Redis 7 + Celery |
| Proxy | Nginx |
| Runtime | Docker Compose (`anbar_network`) |

---

## Port Xəritəsi (conflict-free)

| Servis | Host Port | Container Port |
|---|---|---|
| Nginx (entry) | **8090** | 80 |
| Frontend | **3010** | 3000 |
| Backend API | **8010** | 8000 |
| PostgreSQL | **5435** | 5432 |
| Redis | internal | 6379 |

> Qonşu tətbiqlər: atis (8000/3000/5433), quiz (3005), supabase (54331-54334) — heç biri ilə çakışmır.

---

## Vibe Coding Rejimi

### Rejim A — Sürətli (kiçik dəyişikliklər)

Sadə fix, UI tweak, kiçik əlavə üçün:
- Mövcud kodu oxu → dərhal implement et
- Uzun izahat tələb olunmur, yalnız **nə etdiyini bir cümlə ilə yaz**
- Nümunə: button dəyişikliyi, endpoint parametri əlavə et, validation fix

### Rejim B — Planlı (böyük dəyişikliklər)

Yeni modul, schema dəyişikliyi, refactor üçün:

**User Intent (AZ)** — istifadəçinin yazdığı
**Technical Interpretation (EN)** — texniki ekvivalent
**Impact** — hansı fayllar dəyişəcək
**Plan** — addım-addım
**Quality Gates** — test + lint

| Tapşırıq tipi | Rejim |
|---|---|
| UI dəyişikliyi, label, sadə fix | A |
| Yeni API endpoint | B |
| DB schema / migration | B |
| Yeni domain modeli | B |
| Yeni səhifə/modul | B |
| Refactor (50+ sətir) | B |

---

## ⚠️ Kritik Qaydalar

1. **Docker-only** — heç vaxt `uvicorn` və ya `npm run dev` lokal işlətmə
2. **Migration əvvəlcə yaz, sonra işlət** — mövcud migrationları HEÇVAXT dəyiş
3. **tenant_id hər yerdə** — hər yeni cədvəl `tenant_id` FK saxlamalıdır
4. **Inventory dəyişikliyi yalnız StockMovement vasitəsilə** — quantity-ni birbaşa update etmə
5. **Transaction mandatory** — reservation + order creation mütləq DB transaction içində
6. **FOR UPDATE lock** — reservation zamanı inventory row-u lock et (race condition)
7. **No `any` TypeScript** — strict mode, explicit types
8. **Search before create** — yeni fayl yaratmazdan əvvəl mövcud kodu yoxla

---

## Qovluq Strukturu

```
backend/
  app/
    api/v1/         → HTTP routers (FastAPI APIRouter)
    services/       → Business logic (heç bir DB kodu burda olmaz)
    repositories/   → DB access (yalnız SQLAlchemy queries)
    domain/         → SQLAlchemy models + Pydantic schemas
    core/           → config, database, security, celery_app
  migrations/       → Alembic (env.py + versions/)
  tests/

frontend/
  src/
    app/            → Next.js App Router (pages)
    components/     → Reusable UI components
    hooks/          → React Query hooks (useProducts, useInventory...)
    stores/         → Zustand stores (authStore, uiStore)
    lib/            → axios apiClient + utilities
```

---

## Clean Architecture Qaydaları

### Backend layerləri arası axın:
```
Router → Service → Repository → Domain Model
```
- **Router**: Yalnız HTTP (request/response, validation, deps inject)
- **Service**: Business logic. DB bilmir. Repository-dən istifadə edir
- **Repository**: Yalnız SQLAlchemy. Business logic yoxdur
- **Domain**: SQLAlchemy Model + Pydantic Schema. Heç bir logic yoxdur

### Yeni endpoint əlavə etmək üçün ardıcıllıq:
1. `domain/` — model varsa istifadə et, yoxsa yarat
2. `repositories/` — CRUD metodları yaz
3. `services/` — business logic yaz
4. `api/v1/` — router yaz, `main.py`-a qeydiyyat et
5. Migration yaz (əgər schema dəyişdi)

---

## Biznes Məntiqi Patterns

### Inventory Reservation Flow (CRITICAL):
```python
async with db.begin():
    # 1. Lock row — race condition qarşısını alır
    inventory = await db.execute(
        select(Inventory)
        .where(Inventory.id == inventory_id)
        .with_for_update()
    )
    # 2. Available yoxla
    if inventory.available < qty:
        raise InsufficientStockError()
    # 3. Reserved artır
    inventory.reserved_quantity += qty
    # 4. Movement yaz
    db.add(StockMovement(type=RESERVE, ...))
```

### Available Stock:
```python
available = inventory.quantity - inventory.reserved_quantity
# Bu field DB-də saxlanmır — hər dəfə hesablanır
```

### Tenant Isolation:
```python
# Bütün query-lərə tenant_id filter məcburi
result = await db.execute(
    select(Product)
    .where(Product.tenant_id == current_user.tenant_id)
)
```

---

## Docker Komandaları

```bash
# Start / Stop
docker compose up -d
docker compose down

# Rebuild (kod dəyişdikdə)
docker compose build backend && docker compose up -d backend

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Backend shell
docker exec -it anbar_backend bash

# DB shell
docker exec -it anbar_postgres psql -U anbar_user -d anbar_dev

# Migration işlət
docker exec anbar_backend alembic upgrade head

# Yeni migration yarat
docker exec anbar_backend alembic revision --autogenerate -m "add_orders_table"

# Tests
docker exec anbar_backend pytest -v

# Frontend lint/typecheck
docker exec anbar_frontend npm run lint
docker exec anbar_frontend npx tsc --noEmit
```

---

## API Cavab Formatı

```python
# Uğurlu
{"data": {...}, "message": "ok"}

# Xəta
{"detail": "Error message"}  # FastAPI standart

# Pagination
{"data": [...], "total": 100, "page": 1, "per_page": 20}
```

---

## TypeScript / Frontend Qaydaları

- **React Query** — bütün server state üçün (heç vaxt `useEffect` + `fetch`)
- **Zustand** — yalnız client state üçün (auth, UI state)
- **apiClient** — `src/lib/api.ts`-dən import et, birbaşa `axios` işlətmə
- **Hook pattern**: `src/hooks/useProducts.ts` → `useQuery` wrap et
- **No inline styles** — yalnız Tailwind class
- **Form validation** — React Hook Form + Zod
