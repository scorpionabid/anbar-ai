Aydın oldu — sənə “məsləhət” yox, icra üçün texniki pasport (technical specification + DevOps playbook) lazımdır. Aşağıda sənə real sistem qurmaq üçün istifadə ediləcək sənəd verirəm.

⸻

📘 TECHNICAL PASSPORT

System: Inventory & Sales Core Platform
Type: Modular Monolith (Microservice-ready)
Deployment Model: Container-based (Docker)
Environment: Dedicated Server (Linux)

⸻

1. SYSTEM ARCHITECTURE (LOW-LEVEL)

1.1 Backend
	•	Framework: FastAPI
	•	Pattern: Clean Architecture
	•	Layers:
	•	API (routers)
	•	Service (business logic)
	•	Repository (DB access)
	•	Domain (models)

1.2 Frontend
	•	Framework: Vite + React
	•	Language: JavaScript/TypeScript
	•	State:
	•	Server state: (Planned/Integrated with API)
	•	Client state: Zustand

1.3 Database
	•	PostgreSQL
	•	Isolation: tenant_id (row-level multi-tenancy)

1.4 Async / Queue
	•	Redis
	•	Worker: Celery

1.5 Reverse Proxy
	•	Nginx

1.6 Security Layer
	•	Cloudflare

⸻

2. INFRASTRUCTURE ARCHITECTURE

2.1 Docker Services

services:
  backend:
  frontend:
  postgres:
  redis:
  nginx:
  worker:

2.2 Network
	•	Internal Docker network
	•	Only Nginx exposed (80/443)

2.3 Storage
	•	PostgreSQL → persistent volume
	•	Logs → mounted volume

⸻

3. ENVIRONMENT CONFIGURATION

3.1 ENV Variables

DATABASE_URL=
REDIS_URL=
SECRET_KEY=
JWT_SECRET=
ENV=production


⸻

4. DATABASE REQUIREMENTS

4.1 Constraints
	•	SKU → UNIQUE (tenant_id + sku)
	•	Foreign keys → enforced
	•	NOT NULL critical fields

4.2 Indexing
	•	product_id
	•	warehouse_id
	•	tenant_id
	•	order_id

4.3 Transactions
	•	Mandatory for:
	•	reservation (Uses `FOR UPDATE` to lock stock rows)
	•	order creation
	•	stock adjustments (Atomic movements via `StockMovement` table)

⸻

5. API REQUIREMENTS

5.1 Standards
	•	REST
	•	JSON only
	•	Versioned (/api/v1)

5.2 Security
	•	JWT Access Token
	•	Refresh Token

5.3 Idempotency
	•	Required for:
	•	POST /orders

⸻

6. LOGGING & MONITORING

6.1 Logging
	•	JSON logs
	•	Levels: INFO, ERROR, DEBUG

6.2 Monitoring
	•	Metrics endpoint (/metrics) - Planned
	•	Health check (/health) - Implemented

⸻

7. TESTING INFRASTRUCTURE

7.1 Backend (Pytest)
	•	Strategy: "Nuclear Isolation" — hər test üçün müstəqil AsyncSession və NullPool konfiqurasiyası.
	•	Isolation: Commit/Rollback mexanizmi ilə test məlumatlarının təmizlənməsi.
	•	Coverage: Core services (Auth, Inventory, Orders) 100% test əhatəsindədir.

7.2 Frontend (Vitest)
	•	Framework: Vitest + React Testing Library.
	•	Scope: Store-lar, API interceptor-lar və kritik UI komponentləri.

⸻

7. CI/CD PIPELINE

7.1 Steps

1. Code push
2. Build Docker image
3. Run tests
4. Deploy container

7.2 Tools
	•	GitHub Actions / GitLab CI

⸻

8. DEVOPS KNOWLEDGE REQUIREMENTS

Bu hissə kritikdir — bunu bilmədən sistem “dağılacaq”.

⸻

8.1 Linux Administration
	•	process management (ps, top, htop)
	•	systemd
	•	file permissions
	•	disk management

⸻

8.2 Docker (MÜTLƏQ)
	•	image build
	•	volumes
	•	networks
	•	docker-compose
	•	container debugging

⸻

8.3 Networking
	•	DNS
	•	HTTP/HTTPS
	•	SSL (TLS)
	•	reverse proxy (Nginx)

⸻

8.4 Database Operations
	•	backup/restore (pg_dump)
	•	indexing
	•	query optimization
	•	connection pooling

⸻

8.5 Security
	•	firewall (ufw)
	•	fail2ban
	•	rate limiting
	•	JWT handling

⸻

8.6 CI/CD
	•	pipeline yazmaq
	•	environment separation (dev/staging/prod)
	•	rollback strategiyası

⸻

8.7 Observability
	•	logs analizi
	•	error tracking
	•	alert sistemi

⸻

9. DEPLOYMENT FLOW (REAL)

Step-by-step:

1. Server hazırlanır (Ubuntu)
2. Docker install
3. Repo clone
4. .env config
5. docker-compose up -d
6. Nginx config
7. SSL (Cloudflare)


⸻

10. BACKUP STRATEGY
	•	Daily DB backup
	•	Weekly full snapshot
	•	Offsite storage (optional)

⸻

11. FAILURE SCENARIOS

11.1 DB down
	•	app fail-safe (read-only mode)

11.2 Redis down
	•	queue fallback

11.3 High load
	•	horizontal scaling (future)

⸻

12. SCALING STRATEGY

Phase 1
	•	Single server

Phase 2
	•	Separate DB server

Phase 3
	•	Microservices split:
	•	inventory-service
	•	order-service

⸻

13. PERFORMANCE TARGETS
	•	API < 200ms
	•	DB query < 50ms
	•	1000+ concurrent users (baseline)

⸻

14. ACCEPTANCE CRITERIA
	•	No stock inconsistency
	•	All actions logged
	•	System restart-safe
	•	API stable

⸻

NƏTİCƏ

Bu sənəd:
	•	dev üçün blueprint
	•	devops üçün runbook
	•	sənə isə idarəetmə aləti

⸻

Növbəti mərhələ (tövsiyə edirəm)

İndi bunu tamamlayan 2 kritik sənəd var:

1️⃣ Production DB SQL schema (tam)
2️⃣ docker-compose + nginx config (ready-to-run)

İstəsən növbəti addımda birini dərhal hazırlayım.