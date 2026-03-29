# Import all models so Alembic can detect them
from app.domain.tenant import Tenant
from app.domain.user import User, UserRole
from app.domain.product import Category, Product, ProductVariant
from app.domain.warehouse import Warehouse
from app.domain.inventory import Inventory, StockMovement, MovementType, ReferenceType
from app.domain.customer import Customer, CustomerType
from app.domain.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.domain.payment import Payment, PaymentMethod, PaymentState
from app.domain.supplier import Supplier
from app.domain.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.domain.channel import Channel, ChannelListing, ChannelType
from app.domain.webhook import Webhook, WebhookEvent
from app.domain.settings import TenantSettings, AIProviderKey, NotificationSettings, WeightUnit, DimensionUnit, DateFormat, AIProvider
from app.domain.refresh_token import RefreshToken

__all__ = [
    "Tenant", "User", "UserRole",
    "Webhook", "WebhookEvent",
    "Category", "Product", "ProductVariant",
    "Warehouse",
    "Inventory", "StockMovement", "MovementType", "ReferenceType",
    "Customer", "CustomerType",
    "Order", "OrderItem", "OrderStatus", "PaymentStatus",
    "Payment", "PaymentMethod", "PaymentState",
    "Supplier",
    "PurchaseOrder", "PurchaseOrderItem", "PurchaseOrderStatus",
    "Channel", "ChannelListing", "ChannelType",
    "TenantSettings", "AIProviderKey", "NotificationSettings", "WeightUnit", "DimensionUnit", "DateFormat", "AIProvider",
    "RefreshToken",
]
