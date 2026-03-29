import uuid
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.domain.user import Permission, User, UserRole
from app.repositories.user_repo import UserRepository

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    repo = UserRepository(db)
    user = await repo.get_by_id(uuid.UUID(user_id))
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*roles: UserRole):
    """
    DEPRECATED — require_permissions() istifadə edin.
    Geriyə uyğunluq üçün saxlanılır.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient roles",
            )
        return current_user
    return role_checker


def require_permissions(*permissions: Permission):
    """
    Strategy C: Roles as Permission Groups.
    SUPER_ADMIN bütün permission-ları keçir.
    Digər rollar üçün user.permissions siyahısında tələb olunan permission olmalıdır.
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user

        user_permissions = set(current_user.permissions or [])
        required = set(p.value for p in permissions)
        missing = required - user_permissions

        if missing:
            logger.warning(
                "Permission denied for user %s (role=%s). Missing: %s",
                current_user.id, current_user.role.value, missing,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {', '.join(sorted(missing))}",
            )
        return current_user
    return permission_checker
