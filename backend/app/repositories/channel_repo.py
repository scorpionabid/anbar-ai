import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.channel import Channel, ChannelListing
from app.schemas.channel import ChannelCreate, ChannelUpdate, ChannelListingCreate, ChannelListingUpdate


class ChannelRepository:
    @staticmethod
    async def list(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Channel], int]:
        query = select(Channel).where(Channel.tenant_id == tenant_id)
        if is_active is not None:
            query = query.where(Channel.is_active == is_active)
        if search:
            query = query.where(Channel.name.ilike(f"%{search}%"))

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar_one()

        query = query.order_by(Channel.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(
        db: AsyncSession, channel_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[Channel]:
        result = await db.execute(
            select(Channel).where(
                Channel.id == channel_id, Channel.tenant_id == tenant_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, tenant_id: uuid.UUID, data: ChannelCreate
    ) -> Channel:
        channel = Channel(tenant_id=tenant_id, **data.model_dump())
        db.add(channel)
        await db.flush()
        await db.refresh(channel)
        return channel

    @staticmethod
    async def update(
        db: AsyncSession, channel: Channel, data: ChannelUpdate
    ) -> Channel:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(channel, field, value)
        await db.flush()
        await db.refresh(channel)
        return channel

    @staticmethod
    async def delete(db: AsyncSession, channel: Channel) -> None:
        await db.delete(channel)
        await db.flush()


class ChannelListingRepository:
    @staticmethod
    async def list_by_channel(
        db: AsyncSession,
        channel_id: uuid.UUID,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[ChannelListing], int]:
        query = select(ChannelListing).where(
            ChannelListing.channel_id == channel_id,
            ChannelListing.tenant_id == tenant_id,
        )

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar_one()

        query = query.order_by(ChannelListing.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def list_by_variant(
        db: AsyncSession, variant_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> list[ChannelListing]:
        result = await db.execute(
            select(ChannelListing).where(
                ChannelListing.variant_id == variant_id,
                ChannelListing.tenant_id == tenant_id,
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession, listing_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[ChannelListing]:
        result = await db.execute(
            select(ChannelListing).where(
                ChannelListing.id == listing_id,
                ChannelListing.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_channel_variant(
        db: AsyncSession,
        channel_id: uuid.UUID,
        variant_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> Optional[ChannelListing]:
        result = await db.execute(
            select(ChannelListing).where(
                ChannelListing.channel_id == channel_id,
                ChannelListing.variant_id == variant_id,
                ChannelListing.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, tenant_id: uuid.UUID, data: ChannelListingCreate
    ) -> ChannelListing:
        listing = ChannelListing(tenant_id=tenant_id, **data.model_dump())
        db.add(listing)
        await db.flush()
        await db.refresh(listing)
        return listing

    @staticmethod
    async def update(
        db: AsyncSession, listing: ChannelListing, data: ChannelListingUpdate
    ) -> ChannelListing:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(listing, field, value)
        await db.flush()
        await db.refresh(listing)
        return listing

    @staticmethod
    async def delete(db: AsyncSession, listing: ChannelListing) -> None:
        await db.delete(listing)
        await db.flush()
