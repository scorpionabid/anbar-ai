import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.product import Category, Product, ProductVariant
from app.schemas.product import (
    CategoryCreate,
    ProductCreate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantUpdate,
)


class CategoryRepository:
    @staticmethod
    async def list(db: AsyncSession, tenant_id: uuid.UUID) -> list[Category]:
        result = await db.execute(
            select(Category)
            .where(Category.tenant_id == tenant_id)
            .order_by(Category.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession, category_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[Category]:
        result = await db.execute(
            select(Category).where(
                Category.id == category_id, Category.tenant_id == tenant_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, tenant_id: uuid.UUID, data: CategoryCreate
    ) -> Category:
        category = Category(tenant_id=tenant_id, **data.model_dump())
        db.add(category)
        await db.flush()
        await db.refresh(category)
        return category


class ProductVariantRepository:
    @staticmethod
    async def get_by_id(
        db: AsyncSession, variant_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[ProductVariant]:
        result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.id == variant_id,
                ProductVariant.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_sku(
        db: AsyncSession, sku: str, tenant_id: uuid.UUID
    ) -> Optional[ProductVariant]:
        result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.sku == sku,
                ProductVariant.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
        data: ProductVariantCreate,
    ) -> ProductVariant:
        variant = ProductVariant(
            tenant_id=tenant_id, product_id=product_id, **data.model_dump()
        )
        db.add(variant)
        await db.flush()
        await db.refresh(variant)
        return variant

    @staticmethod
    async def update(
        db: AsyncSession, variant: ProductVariant, data: ProductVariantUpdate
    ) -> ProductVariant:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(variant, field, value)
        await db.flush()
        await db.refresh(variant)
        return variant


class ProductRepository:
    @staticmethod
    async def list(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        category_id: Optional[uuid.UUID] = None,
        is_active: Optional[bool] = True,
    ) -> tuple[list[Product], int]:
        query = (
            select(Product)
            .where(Product.tenant_id == tenant_id)
            .options(selectinload(Product.variants))
        )
        if category_id is not None:
            query = query.where(Product.category_id == category_id)
        if is_active is not None:
            query = query.where(Product.is_active == is_active)

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar_one()

        query = query.order_by(Product.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(
        db: AsyncSession, product_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[Product]:
        result = await db.execute(
            select(Product)
            .where(Product.id == product_id, Product.tenant_id == tenant_id)
            .options(selectinload(Product.variants))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_sku(
        db: AsyncSession, sku: str, tenant_id: uuid.UUID
    ) -> Optional[Product]:
        result = await db.execute(
            select(Product).where(Product.sku == sku, Product.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, tenant_id: uuid.UUID, data: ProductCreate
    ) -> Product:
        product = Product(
            tenant_id=tenant_id,
            name=data.name,
            sku=data.sku,
            description=data.description,
            category_id=data.category_id,
        )
        db.add(product)
        await db.flush()
        for v_data in data.variants:
            variant = ProductVariant(
                tenant_id=tenant_id, product_id=product.id, **v_data.model_dump()
            )
            db.add(variant)
        await db.flush()
        await db.refresh(product, ["variants"])
        return product

    @staticmethod
    async def update(
        db: AsyncSession, product: Product, data: ProductUpdate
    ) -> Product:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(product, field, value)
        await db.flush()
        await db.refresh(product, ["variants"])
        return product

    @staticmethod
    async def soft_delete(db: AsyncSession, product: Product) -> None:
        product.is_active = False
        await db.flush()
