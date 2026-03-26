# Import all models so Alembic can detect them
from app.domain.tenant import Tenant
from app.domain.user import User, UserRole
from app.domain.product import Category, Product, ProductVariant
from app.domain.warehouse import Warehouse
from app.domain.inventory import Inventory, StockMovement, MovementType, ReferenceType

__all__ = [
    "Tenant", "User", "UserRole",
    "Category", "Product", "ProductVariant",
    "Warehouse",
    "Inventory", "StockMovement", "MovementType", "ReferenceType",
]
