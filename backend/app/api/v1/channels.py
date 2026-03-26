import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.domain.user import User, UserRole
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
from app.services.channel_service import ChannelListingService, ChannelService

router = APIRouter(prefix="/channels", tags=["channels"])


# ── Channels CRUD ─────────────────────────────────────────────────────────────

@router.get("", response_model=ChannelListResponse)
async def list_channels(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ChannelService.list_channels(
        db, current_user.tenant_id, page, per_page, is_active
    )


@router.post("", response_model=ChannelResponse, status_code=201)
async def create_channel(
    data: ChannelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN)),
):
    return await ChannelService.create_channel(db, current_user.tenant_id, data)


@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(
    channel_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ChannelService.get_channel(db, channel_id, current_user.tenant_id)


@router.put("/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: uuid.UUID,
    data: ChannelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN)),
):
    return await ChannelService.update_channel(
        db, channel_id, current_user.tenant_id, data
    )


@router.delete("/{channel_id}", status_code=204)
async def delete_channel(
    channel_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN)),
):
    await ChannelService.delete_channel(db, channel_id, current_user.tenant_id)


# ── Channel Listings ──────────────────────────────────────────────────────────

@router.get("/{channel_id}/listings", response_model=ChannelListingListResponse)
async def list_listings(
    channel_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ChannelListingService.list_listings(
        db, channel_id, current_user.tenant_id, page, per_page
    )


@router.post("/{channel_id}/listings", response_model=ChannelListingResponse, status_code=201)
async def create_listing(
    channel_id: uuid.UUID,
    data: ChannelListingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE_MANAGER)
    ),
):
    # Ensure path param matches body — override body channel_id with path param
    data_with_channel = data.model_copy(update={"channel_id": channel_id})
    return await ChannelListingService.create_listing(
        db, current_user.tenant_id, data_with_channel
    )


@router.put("/{channel_id}/listings/{listing_id}", response_model=ChannelListingResponse)
async def update_listing(
    channel_id: uuid.UUID,
    listing_id: uuid.UUID,
    data: ChannelListingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE_MANAGER)
    ),
):
    return await ChannelListingService.update_listing(
        db, listing_id, current_user.tenant_id, data
    )


@router.delete("/{channel_id}/listings/{listing_id}", status_code=204)
async def delete_listing(
    channel_id: uuid.UUID,
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE_MANAGER)
    ),
):
    await ChannelListingService.delete_listing(
        db, listing_id, current_user.tenant_id
    )
