import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.domain.user import User
from app.schemas.product import CategoryCreate, CategoryResponse
from app.services.product_service import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse], summary="Kateqoriyaların siyahısı")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bütün məhsul kateqoriyalarının siyahısını qaytarır."""
    return await CategoryService.list_categories(db, current_user.tenant_id)


@router.post("", response_model=CategoryResponse, status_code=201, summary="Yeni kateqoriya yarat")
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yeni məhsul kateqoriyası yaradır. İyerarxiya üçün `parent_id` istifadə oluna bilər."""
    return await CategoryService.create_category(db, current_user.tenant_id, data)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi import HTTPException, status
    from app.repositories.product_repo import CategoryRepository

    category = await CategoryRepository.get_by_id(db, category_id, current_user.tenant_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return CategoryResponse.model_validate(category)
