import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.domain.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import DEFAULT_ROLE_PERMISSIONS, UserCreate, UserProfileUpdate, UserUpdate


class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def list_users(self, tenant_id: uuid.UUID) -> list[User]:
        return await self.repo.list_by_tenant(tenant_id)

    async def create_user(
        self, tenant_id: uuid.UUID, data: UserCreate
    ) -> User:
        # Assign default permissions if none provided
        permissions = data.permissions
        if permissions is None:
            permissions = DEFAULT_ROLE_PERMISSIONS.get(data.role, [])

        user = User(
            tenant_id=tenant_id,
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            role=data.role,
            permissions=[p.value for p in permissions] if permissions else [],
        )
        user = await self.repo.create(user)
        await self.repo.db.commit()
        return user

    async def update_user(
        self, user_id: uuid.UUID, tenant_id: uuid.UUID, data: UserUpdate
    ) -> User:
        user = await self.repo.get_by_id_and_tenant(user_id, tenant_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        updates = data.model_dump(exclude_none=True)
        if not updates:
            return user

        # Role dəyişdikdə, permissions açıq verilməyibsə, yeni rolun default permissions-ını tətbiq et
        if data.role is not None and data.permissions is None:
            default_perms = DEFAULT_ROLE_PERMISSIONS.get(data.role, [])
            updates["permissions"] = [p.value for p in default_perms]

        user = await self.repo.update(user, **updates)
        await self.repo.db.commit()
        return user

    async def deactivate_user(
        self, user_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> User:
        user = await self.repo.get_by_id_and_tenant(user_id, tenant_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        user = await self.repo.update(user, is_active=False)
        await self.repo.db.commit()
        return user

    async def delete_user(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> None:
        """Permanently delete a user (Hard Delete)"""
        user = await self.repo.get_by_id_and_tenant(user_id, tenant_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        
        await self.repo.delete(user)
        await self.repo.db.commit()

    async def update_my_profile(
        self, user_id: uuid.UUID, data: UserProfileUpdate
    ) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Password change — requires current_password verification
        if data.new_password is not None:
            if not data.current_password:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="current_password is required when setting a new password",
                )
            if not verify_password(data.current_password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect",
                )

        updates: dict = {}

        if data.full_name is not None:
            updates["full_name"] = data.full_name

        if data.email is not None and data.email != user.email:
            existing = await self.repo.get_by_email(data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this email already exists",
                )
            updates["email"] = data.email

        if data.new_password is not None:
            updates["hashed_password"] = hash_password(data.new_password)

        if not updates:
            return user

        user = await self.repo.update(user, **updates)
        await self.repo.db.commit()
        return user
