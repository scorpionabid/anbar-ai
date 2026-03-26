---
name: anbar-newmodule
description: ANBAR-da yeni Clean Architecture modulu scaffold et — $ARGUMENTS modul adıdır (məs. "order", "vendor", "purchase")
---

$ARGUMENTS adlı yeni modul üçün tam Clean Architecture scaffold yarat.

Aşağıdakı ardıcıllıqla hər faylı yarat:

## 1. Domain Model (`backend/app/domain/$ARGUMENTS.py`)

```python
# SQLAlchemy model + Pydantic schemas
# Şablon:
import uuid
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel
from app.core.database import Base
from app.domain.base import TimestampMixin, UUIDPrimaryKeyMixin

class $ARGUMENTS_pascal_case(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "$ARGUMENTS_plural"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    # ... fields

# Pydantic schemas
class $ARGUMENTS_pascal_caseCreate(BaseModel): ...
class $ARGUMENTS_pascal_caseUpdate(BaseModel): ...
class $ARGUMENTS_pascal_caseRead(BaseModel):
    model_config = {"from_attributes": True}
```

## 2. Repository (`backend/app/repositories/$ARGUMENTS_repo.py`)

```python
# Yalnız DB access — business logic yoxdur
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.$ARGUMENTS import $ARGUMENTS_pascal_case

class $ARGUMENTS_pascal_caseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, tenant_id: uuid.UUID) -> list[$ARGUMENTS_pascal_case]:
        result = await self.db.execute(
            select($ARGUMENTS_pascal_case)
            .where($ARGUMENTS_pascal_case.tenant_id == tenant_id)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: uuid.UUID, tenant_id: uuid.UUID) -> $ARGUMENTS_pascal_case | None:
        result = await self.db.execute(
            select($ARGUMENTS_pascal_case)
            .where($ARGUMENTS_pascal_case.id == id, $ARGUMENTS_pascal_case.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def create(self, obj: $ARGUMENTS_pascal_case) -> $ARGUMENTS_pascal_case:
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj
```

## 3. Service (`backend/app/services/$ARGUMENTS_service.py`)

```python
# Business logic — DB bilmir
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.$ARGUMENTS_repo import $ARGUMENTS_pascal_caseRepository
from app.domain.$ARGUMENTS import $ARGUMENTS_pascal_case, $ARGUMENTS_pascal_caseCreate

class $ARGUMENTS_pascal_caseService:
    def __init__(self, db: AsyncSession):
        self.repo = $ARGUMENTS_pascal_caseRepository(db)

    async def list(self, tenant_id: uuid.UUID):
        return await self.repo.get_all(tenant_id)

    async def create(self, data: $ARGUMENTS_pascal_caseCreate, tenant_id: uuid.UUID):
        obj = $ARGUMENTS_pascal_case(tenant_id=tenant_id, **data.model_dump())
        return await self.repo.create(obj)
```

## 4. Router (`backend/app/api/v1/$ARGUMENTS_plural.py`)

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.domain.user import User
from app.services.$ARGUMENTS_service import $ARGUMENTS_pascal_caseService
from app.domain.$ARGUMENTS import $ARGUMENTS_pascal_caseCreate, $ARGUMENTS_pascal_caseRead

router = APIRouter(prefix="/$ARGUMENTS_plural", tags=["$ARGUMENTS_plural"])

@router.get("/", response_model=list[$ARGUMENTS_pascal_caseRead])
async def list_$ARGUMENTS_plural(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = $ARGUMENTS_pascal_caseService(db)
    return await svc.list(current_user.tenant_id)

@router.post("/", response_model=$ARGUMENTS_pascal_caseRead, status_code=201)
async def create_$ARGUMENTS(
    data: $ARGUMENTS_pascal_caseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = $ARGUMENTS_pascal_caseService(db)
    return await svc.create(data, current_user.tenant_id)
```

## 5. `main.py`-a qeydiyyat et

`backend/app/main.py` faylına əlavə et:
```python
from app.api.v1.$ARGUMENTS_plural import router as $ARGUMENTS_router
app.include_router($ARGUMENTS_router, prefix="/api/v1")
```

## 6. Domain `__init__.py`-ı yenilə

`backend/app/domain/__init__.py`-ə yeni modeli import et.

## 7. Migration yarat

```bash
docker exec anbar_backend alembic revision --autogenerate -m "add_$ARGUMENTS_plural_table"
docker exec anbar_backend alembic upgrade head
```

## 8. Frontend hook yarat (`frontend/src/hooks/use$ARGUMENTS_pascal_case.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export function use$ARGUMENTS_pascal_cases() {
  return useQuery({
    queryKey: ["$ARGUMENTS_plural"],
    queryFn: async () => {
      const { data } = await apiClient.get("/$ARGUMENTS_plural/");
      return data;
    },
  });
}

export function useCreate$ARGUMENTS_pascal_case() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) =>
      apiClient.post("/$ARGUMENTS_plural/", payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["$ARGUMENTS_plural"] });
    },
  });
}
```
