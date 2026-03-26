---
name: anbar-logs
description: ANBAR servis loglarını izlə — real-time monitoring, xəta analizi
---

ANBAR log izləmə əmrləri. $ARGUMENTS ilə servis adı göstərilə bilər (backend, frontend, postgres, redis, worker, nginx).

## Real-time Log İzləmə

1. **Bütün servislərin logları**: `docker compose logs -f`
2. **Yalnız backend**: `docker compose logs -f backend`
3. **Yalnız frontend**: `docker compose logs -f frontend`
4. **Worker (Celery)**: `docker compose logs -f worker`
5. **Nginx access log**: `docker compose logs -f nginx`
6. **Postgres**: `docker compose logs -f postgres`

## Son N Sətir

1. **Backend son 100 sətir**: `docker compose logs backend --tail=100`
2. **Bütün servisler son 50 sətir**: `docker compose logs --tail=50`
3. **Worker son 50 sətir**: `docker compose logs worker --tail=50`

## Xəta Filtri

1. **Backend-dən yalnız ERROR**: `docker compose logs backend 2>&1 | grep -i "error\|exception\|traceback"`
2. **Son 200 sətirdə xəta axtar**: `docker compose logs backend --tail=200 2>&1 | grep -iE "ERROR|CRITICAL|Exception"`
3. **Specific endpoint log**: `docker compose logs backend 2>&1 | grep "/api/v1/inventory"`

## Container Status & Resource

1. **Konteyner status**: `docker compose ps`
2. **Resource usage (CPU/RAM)**: `docker stats anbar_backend anbar_frontend anbar_postgres anbar_redis anbar_worker --no-stream`
3. **Container inspect**: `docker inspect anbar_backend | python3 -m json.tool`

## Nginx Access Log

1. **Access log real-time**: `docker exec anbar_nginx tail -f /var/log/nginx/access.log`
2. **Error log**: `docker exec anbar_nginx tail -f /var/log/nginx/error.log`

## Troubleshooting

1. **Backend restart** (log qırıldısa): `docker compose restart backend`
2. **Worker restart**: `docker compose restart worker`
3. **Nginx reload** (config dəyişdikdə): `docker exec anbar_nginx nginx -s reload`
4. **Konteyner içinə gir**: `docker exec -it anbar_backend bash`
