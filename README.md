# ANBAR — Cloud-Native Inventory & Order Management System

ANBAR is a modern, multi-tenant ERP-lite system designed for small to medium enterprises to manage their inventory, products, and sales/purchase orders efficiently.

## 🚀 Features

- **Multi-tenancy**: Complete data isolation between different organizations.
- **Inventory Management**: Real-time stock tracking with FIFO-ready movement logs.
- **Order Lifecycle**: Automated workflows from Draft to Delivery.
- **Product Catalog**: Support for complex product variants and hierarchical categories.
- **RESTful API**: Fully documented with OpenAPI/Swagger.

## 🛠 Tech Stack

- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0 (Async), PostgreSQL.
- **Frontend**: React, Vite, Tailwind CSS (Visual Excellence focus).
- **Infrastucture**: Docker, Docker Compose.
- **Testing**: Pytest (Backend), Vitest (Frontend).

## 🏃 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for frontend development)
- Python 3.11+ (for local backend development)

### Local Development (Docker)
```bash
# Clone the repository
git clone https://github.com/scorpionabid/anbar-ai.git
cd anbar-ai

# Start all services
docker-compose up -d
```
The API will be available at `http://localhost:8000` and the Frontend at `http://localhost:5173`.

## 📖 Documentation

- **API Reference**: `http://localhost:8000/docs` (Swagger)
- **Technical Passport**: [documents/technopass.md](documents/technopass.md) — Detailed architecture and design patterns.
- **Development Guide**: [CLAUDE.md](CLAUDE.md) — Environment setup and coding standards.

## 🧪 Testing

### Backend
```bash
docker-compose exec backend pytest
```

### Frontend
```bash
cd frontend
npm run test
```

## 📜 License
Proprietary. Designed for the ANBAR ecosystem.
