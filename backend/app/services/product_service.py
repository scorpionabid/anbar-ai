import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.product_repo import (
    CategoryRepository,
    ProductRepository,
    ProductVariantRepository,
)
from app.schemas.product import (
    CategoryCreate,
    CategoryUpdate,
    CategoryListResponse,
    CategoryResponse,
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
)


class CategoryService:
    @staticmethod
    async def list_categories(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> CategoryListResponse:
        categories, total = await CategoryRepository.list(
            db, tenant_id, search, is_active, page, per_page
        )
        return CategoryListResponse(
            data=[CategoryResponse.model_validate(c) for c in categories],
            total=total,
            page=page,
            per_page=per_page,
        )

    @staticmethod
    async def create_category(
        db: AsyncSession, tenant_id: uuid.UUID, data: CategoryCreate
    ) -> CategoryResponse:
        # Validate parent exists in same tenant
        if data.parent_id:
            parent = await CategoryRepository.get_by_id(db, data.parent_id, tenant_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent category not found",
                )
        category = await CategoryRepository.create(db, tenant_id, data)
        return CategoryResponse.model_validate(category)

    @staticmethod
    async def update_category(
        db: AsyncSession,
        category_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: CategoryUpdate,
    ) -> CategoryResponse:
        category = await CategoryRepository.get_by_id(db, category_id, tenant_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )
        # Validate parent if provided
        if data.parent_id:
            if data.parent_id == category_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category cannot be its own parent",
                )
            parent = await CategoryRepository.get_by_id(db, data.parent_id, tenant_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent category not found",
                )
        updated = await CategoryRepository.update(db, category, data)
        await db.commit()
        return CategoryResponse.model_validate(updated)

    @staticmethod
    async def delete_category(
        db: AsyncSession, category_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        category = await CategoryRepository.get_by_id(db, category_id, tenant_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )
        # Check if has products or children?
        # For now, just delete (SQLAlchemy will handle FKs or fail)
        await CategoryRepository.delete(db, category)
        await db.commit()


class ProductService:
    @staticmethod
    async def list_products(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        category_id: Optional[uuid.UUID] = None,
    ) -> ProductListResponse:
        products, total = await ProductRepository.list(
            db, tenant_id, page, per_page, category_id
        )
        return ProductListResponse(
            data=[ProductResponse.model_validate(p) for p in products],
            total=total,
            page=page,
            per_page=per_page,
        )

    @staticmethod
    async def get_product(
        db: AsyncSession, product_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> ProductResponse:
        product = await ProductRepository.get_by_id(db, product_id, tenant_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
            )
        return ProductResponse.model_validate(product)

    @staticmethod
    async def create_product(
        db: AsyncSession, tenant_id: uuid.UUID, data: ProductCreate
    ) -> ProductResponse:
        # Check SKU uniqueness
        existing = await ProductRepository.get_by_sku(db, data.sku, tenant_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{data.sku}' already exists",
            )
        # Check variant SKU uniqueness
        for v in data.variants:
            existing_v = await ProductVariantRepository.get_by_sku(db, v.sku, tenant_id)
            if existing_v:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Variant with SKU '{v.sku}' already exists",
                )
        product = await ProductRepository.create(db, tenant_id, data)
        await db.commit()
        await db.refresh(product, ["variants"])
        return ProductResponse.model_validate(product)

    @staticmethod
    async def update_product(
        db: AsyncSession,
        product_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: ProductUpdate,
    ) -> ProductResponse:
        product = await ProductRepository.get_by_id(db, product_id, tenant_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
            )
        # SKU change uniqueness check
        if data.sku and data.sku != product.sku:
            existing = await ProductRepository.get_by_sku(db, data.sku, tenant_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product with SKU '{data.sku}' already exists",
                )
        product = await ProductRepository.update(db, product, data)
        await db.commit()
        return ProductResponse.model_validate(product)

    @staticmethod
    async def delete_product(
        db: AsyncSession, product_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        product = await ProductRepository.get_by_id(db, product_id, tenant_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
            )
        await ProductRepository.soft_delete(db, product)
        await db.commit()

    @staticmethod
    async def add_variant(
        db: AsyncSession,
        product_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: ProductVariantCreate,
    ) -> ProductVariantResponse:
        product = await ProductRepository.get_by_id(db, product_id, tenant_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
            )
        existing = await ProductVariantRepository.get_by_sku(db, data.sku, tenant_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Variant with SKU '{data.sku}' already exists",
            )
        variant = await ProductVariantRepository.create(db, tenant_id, product_id, data)
        await db.commit()
        return ProductVariantResponse.model_validate(variant)

    @staticmethod
    async def update_variant(
        db: AsyncSession,
        product_id: uuid.UUID,
        variant_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: ProductVariantUpdate,
    ) -> ProductVariantResponse:
        variant = await ProductVariantRepository.get_by_id(db, variant_id, tenant_id)
        if not variant or variant.product_id != product_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
            )
        variant = await ProductVariantRepository.update(db, variant, data)
        await db.commit()
        return ProductVariantResponse.model_validate(variant)
