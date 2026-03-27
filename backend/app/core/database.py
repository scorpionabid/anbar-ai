from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

def get_engine(url: str = settings.DATABASE_URL):
    return create_async_engine(
        url,
        echo=settings.ENV == "development",
        pool_pre_ping=True,
    )

engine = get_engine()

def get_sessionmaker(engine_instance=None):
    return async_sessionmaker(
        engine_instance or engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

AsyncSessionLocal = get_sessionmaker()


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
