import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, token: RefreshToken) -> RefreshToken:
        self.db.add(token)
        await self.db.flush()
        await self.db.refresh(token)
        return token

    async def get_by_jti(self, jti: str, tenant_id: uuid.UUID) -> RefreshToken | None:
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.jti == jti,
                RefreshToken.tenant_id == tenant_id,
                RefreshToken.is_revoked == False,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def get_by_token_hash(self, token_hash: str, tenant_id: uuid.UUID) -> RefreshToken | None:
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.tenant_id == tenant_id,
                RefreshToken.is_revoked == False,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def revoke(self, token: RefreshToken) -> None:
        """Tək bir refresh token-i revoke et."""
        token.is_revoked = True
        await self.db.flush()

    async def revoke_all_for_user(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> int:
        """İstifadəçinin bütün aktiv refresh token-lərini revoke et (force logout)."""
        result = await self.db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.tenant_id == tenant_id,
                RefreshToken.is_revoked == False,  # noqa: E712
            )
            .values(is_revoked=True)
        )
        await self.db.flush()
        return result.rowcount  # type: ignore[return-value]
