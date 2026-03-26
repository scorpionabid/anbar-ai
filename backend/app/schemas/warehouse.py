import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class WarehouseCreate(BaseModel):
    name: str
    address: Optional[str] = None


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class WarehouseResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    address: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
