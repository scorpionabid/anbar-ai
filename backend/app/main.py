from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.products import router as products_router
from app.api.v1.warehouses import router as warehouses_router
from app.api.v1.inventory import router as inventory_router

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


@app.get("/")
async def root():
    return {"message": "ANBAR API is running", "docs": "/api/docs"}
