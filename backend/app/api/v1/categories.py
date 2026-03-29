import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permissions
from app.core.database import get_db
from app.domain.user import Permission, User
from app.schemas.product import CategoryCreate, CategoryUpdate, CategoryListResponse, CategoryResponse
from app.services.product_service import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=CategoryListResponse, summary="Kateqoriyaların siyahısı")
async def list_categories(
    search: Optional[str] = Query(None, description="Ad və ya açıqlama üzrə axtarış"),
    is_active: Optional[bool] = Query(None, description="Aktivlik statusuna görə filtr"),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_READ)),
):
    """
    Bütün məhsul kateqoriyalarının siyahısını qaytarır.
    Axtarış, filtr və səhifələmə dəstəklənir.
    """
    return await CategoryService.list_categories(
        db, current_user.tenant_id, search, is_active, page, per_page
    )


@router.post("", response_model=CategoryResponse, status_code=201, summary="Yeni kateqoriya yarat")
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_WRITE)),
):
    """Yeni məhsul kateqoriyası yaradır. İyerarxiya üçün `parent_id` istifadə oluna bilər."""
    return await CategoryService.create_category(db, current_user.tenant_id, data)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_READ)),
):
    from fastapi import HTTPException, status
    from app.repositories.product_repo import CategoryRepository

    category = await CategoryRepository.get_by_id(db, category_id, current_user.tenant_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return CategoryResponse.model_validate(category)


@router.put("/{category_id}", response_model=CategoryResponse, summary="Kateqoriyanı yenilə")
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_WRITE)),
):
    """Mövcud kateqoriyanın məlumatlarını yeniləyir."""
    return await CategoryService.update_category(db, category_id, current_user.tenant_id, data)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Kateqoriyanı sil")
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(Permission.INVENTORY_MANAGE)),
):
    """
    Kateqoriyanı silir.
    Əgər kateqoriyaya bağlı məhsullar və ya alt kateqoriyalar varsa, əməliyyat bazadan asılı olaraq xəta verə bilər.
    """
    from fastapi import Response
    await CategoryService.delete_category(db, category_id, current_user.tenant_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
