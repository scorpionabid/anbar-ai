---
name: anbar-test
description: ANBAR layihəsinin test suite-ini işə sal — backend pytest, frontend lint/typecheck
---

ANBAR üçün hərtərəfli test proseduru:

## Backend Testləri (pytest)

1. **Bütün testlər**: `docker exec anbar_backend pytest -v`
2. **Müəyyən modul test et**: `docker exec anbar_backend pytest tests/$ARGUMENTS -v`
3. **Coverage ilə**: `docker exec anbar_backend pytest --cov=app --cov-report=term-missing`
4. **Sürətli (xəta görəndə dayan)**: `docker exec anbar_backend pytest -x -v`
5. **Keyword filter**: `docker exec anbar_backend pytest -k "inventory" -v`

## Frontend Testləri

1. **TypeScript yoxla**: `docker exec anbar_frontend npx tsc --noEmit`
2. **ESLint**: `docker exec anbar_frontend npm run lint`
3. **Build test (production)**: `docker exec anbar_frontend npm run build`

## API Manuel Test (curl)

1. **Health check**: `curl -s http://localhost:8090/api/v1/health | python3 -m json.tool`
2. **Login test**:
   ```
   curl -s -X POST http://localhost:8090/api/v1/auth/login \
     -d "username=admin@demo.com&password=admin123" \
     -H "Content-Type: application/x-www-form-urlencoded" | python3 -m json.tool
   ```
3. **Token ilə request**:
   ```
   curl -s http://localhost:8090/api/v1/products \
     -H "Authorization: Bearer <TOKEN>" | python3 -m json.tool
   ```

## Container Status Yoxla

1. **Bütün servisləri yoxla**: `docker compose ps`
2. **Resource usage**: `docker stats anbar_backend anbar_frontend anbar_postgres anbar_redis --no-stream`
3. **Backend error log**: `docker compose logs backend --tail=50`
4. **Worker log**: `docker compose logs worker --tail=30`

## Code Quality

1. **Python format (black)**: `docker exec anbar_backend black app/ --check`
2. **Python lint (ruff)**: `docker exec anbar_backend ruff check app/`
3. **Import sort**: `docker exec anbar_backend isort app/ --check-only`

## Full Quality Gate (hamısını ardıcıl işlət)

```bash
docker exec anbar_backend pytest -x -v && \
docker exec anbar_frontend npx tsc --noEmit && \
docker exec anbar_frontend npm run lint && \
echo "✅ All checks passed"
```
