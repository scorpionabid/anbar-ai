import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.channel_repo import ChannelListingRepository, ChannelRepository
from app.schemas.channel import (
    ChannelCreate,
    ChannelListResponse,
    ChannelListingCreate,
    ChannelListingListResponse,
    ChannelListingResponse,
    ChannelListingUpdate,
    ChannelResponse,
    ChannelUpdate,
)
from typing import Optional


class ChannelService:
    @staticmethod
    async def list_channels(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        is_active: Optional[bool] = None,
    ) -> ChannelListResponse:
        channels, total = await ChannelRepository.list(
            db, tenant_id, page, per_page, is_active
        )
        return ChannelListResponse(
            data=[ChannelResponse.model_validate(c) for c in channels],
            total=total,
            page=page,
            per_page=per_page,
        )

    @staticmethod
    async def get_channel(
        db: AsyncSession, channel_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> ChannelResponse:
        channel = await ChannelRepository.get_by_id(db, channel_id, tenant_id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
            )
        return ChannelResponse.model_validate(channel)

    @staticmethod
    async def create_channel(
        db: AsyncSession, tenant_id: uuid.UUID, data: ChannelCreate
    ) -> ChannelResponse:
        channel = await ChannelRepository.create(db, tenant_id, data)
        await db.commit()
        await db.refresh(channel)
        return ChannelResponse.model_validate(channel)

    @staticmethod
    async def update_channel(
        db: AsyncSession,
        channel_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: ChannelUpdate,
    ) -> ChannelResponse:
        channel = await ChannelRepository.get_by_id(db, channel_id, tenant_id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
            )
        channel = await ChannelRepository.update(db, channel, data)
        await db.commit()
        return ChannelResponse.model_validate(channel)

    @staticmethod
    async def delete_channel(
        db: AsyncSession, channel_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        channel = await ChannelRepository.get_by_id(db, channel_id, tenant_id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
            )
        await ChannelRepository.delete(db, channel)
        await db.commit()


class ChannelListingService:
    @staticmethod
    async def list_listings(
        db: AsyncSession,
        channel_id: uuid.UUID,
        tenant_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> ChannelListingListResponse:
        # Verify the channel belongs to this tenant
        channel = await ChannelRepository.get_by_id(db, channel_id, tenant_id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
            )
        listings, total = await ChannelListingRepository.list_by_channel(
            db, channel_id, tenant_id, page, per_page
        )
        return ChannelListingListResponse(
            data=[ChannelListingResponse.model_validate(l) for l in listings],
            total=total,
            page=page,
            per_page=per_page,
        )

    @staticmethod
    async def create_listing(
        db: AsyncSession, tenant_id: uuid.UUID, data: ChannelListingCreate
    ) -> ChannelListingResponse:
        # Verify channel belongs to tenant
        channel = await ChannelRepository.get_by_id(db, data.channel_id, tenant_id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
            )
        # Uniqueness check — (channel_id, variant_id) must be unique
        existing = await ChannelListingRepository.get_by_channel_variant(
            db, data.channel_id, data.variant_id, tenant_id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A listing for this variant already exists in the channel",
            )
        listing = await ChannelListingRepository.create(db, tenant_id, data)
        await db.commit()
        await db.refresh(listing)
        return ChannelListingResponse.model_validate(listing)

    @staticmethod
    async def update_listing(
        db: AsyncSession,
        listing_id: uuid.UUID,
        tenant_id: uuid.UUID,
        data: ChannelListingUpdate,
    ) -> ChannelListingResponse:
        listing = await ChannelListingRepository.get_by_id(db, listing_id, tenant_id)
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Channel listing not found"
            )
        listing = await ChannelListingRepository.update(db, listing, data)
        await db.commit()
        return ChannelListingResponse.model_validate(listing)

    @staticmethod
    async def delete_listing(
        db: AsyncSession, listing_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        listing = await ChannelListingRepository.get_by_id(db, listing_id, tenant_id)
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Channel listing not found"
            )
        await ChannelListingRepository.delete(db, listing)
        await db.commit()
