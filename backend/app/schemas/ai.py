from pydantic import BaseModel


class GenerateDescriptionRequest(BaseModel):
    product_name: str
    category: str | None = None
    attributes: dict[str, str] | None = None


class GenerateDescriptionResponse(BaseModel):
    description: str


class ReorderSuggestion(BaseModel):
    variant_id: str
    variant_name: str
    sku: str
    warehouse_name: str
    current_stock: int
    reorder_point: int
    suggested_quantity: int
    avg_daily_consumption: float
    reason: str
