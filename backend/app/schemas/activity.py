import enum
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ActivityType(str, enum.Enum):
    STOCK_MOVEMENT = "stock_movement"
    ORDER = "order"
    PURCHASE_ORDER = "purchase_order"


class ActivityItem(BaseModel):
    model_config = ConfigDict(from_attributes=False)

    id: str           # prefixed: "sm_{id}", "ord_{id}", "po_{id}"
    type: ActivityType
    description: str  # human-readable
    timestamp: datetime
    metadata: dict    # extra context fields
