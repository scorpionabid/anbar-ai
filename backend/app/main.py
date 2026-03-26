from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.products import router as products_router
from app.api.v1.warehouses import router as warehouses_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.customers import router as customers_router
from app.api.v1.suppliers import router as suppliers_router
from app.api.v1.channels import router as channels_router
from app.api.v1.purchase_orders import router as purchase_orders_router
from app.api.v1.orders import router as orders_router
from app.api.v1.payments import router as payments_router

app = FastAPI(
    title="ANBAR — Inventory & Sales Core",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3010", "http://localhost:8090"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(warehouses_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(suppliers_router, prefix="/api/v1")
app.include_router(channels_router, prefix="/api/v1")
app.include_router(purchase_orders_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "ANBAR API is running", "docs": "/api/docs"}
