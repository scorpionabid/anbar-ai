import asyncio
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# ── IMPORTANT: Setup Test DB before any other app imports ─────────────────────
from app.core.config import settings

_base_url, _db_name = settings.DATABASE_URL.rsplit("/", 1)
TEST_DATABASE_URL = f"{_base_url}/{_db_name}_test"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Patch app.core.database
import app.core.database as db_module

@pytest_asyncio.fixture(scope="session")
async def engine(event_loop):
    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    # Patch the global engine in app.core.database
    db_module.engine = engine
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db(engine):
    from app.core.database import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncSession:
    """Hər test üçün tam müstəqil session. Loop qarışıqlığını önləyir."""
    Session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    # We use a context manager but NO commit at the end here to avoid loop issues
    async with Session() as session:
        yield session
    # Session closes automatically here


# ── HTTP Client Fixture ───────────────────────────────────────────────────────
from app.main import app as fastapi_app
from app.core.database import get_db

@pytest_asyncio.fixture
async def client(engine) -> AsyncClient:
    """FastAPI test client. Shared session strategy replaced by individual sessions."""
    async def override_get_db():
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with Session() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), 
        base_url="http://test",
    ) as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()


# ── Factory Fixtures ──────────────────────────────────────────────────────────
from app.domain.tenant import Tenant
from app.domain.user import User, UserRole
from app.domain.warehouse import Warehouse
from app.domain.product import Product, ProductVariant
from app.core.security import hash_password, create_access_token

@pytest_asyncio.fixture
async def tenant(db_session: AsyncSession) -> Tenant:
    t = Tenant(
        id=uuid.uuid4(),
        name="Test Şirkəti",
        slug=f"test-{uuid.uuid4().hex[:6]}",
        is_active=True,
    )
    db_session.add(t)
    await db_session.commit() # Important: Commit to DB so it's visible globally
    return t


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession, tenant: Tenant) -> User:
    u = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=f"admin-{uuid.uuid4().hex[:6]}@test.az",
        hashed_password=hash_password("Test1234!"),
        full_name="Test Admin",
        role=UserRole.ORG_ADMIN,
        is_active=True,
    )
    db_session.add(u)
    await db_session.commit()
    return u


@pytest_asyncio.fixture
async def warehouse(db_session: AsyncSession, tenant: Tenant) -> Warehouse:
    w = Warehouse(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        name="Əsas Anbar",
        is_active=True,
    )
    db_session.add(w)
    await db_session.commit()
    return w


@pytest_asyncio.fixture
async def product(db_session: AsyncSession, tenant: Tenant) -> Product:
    p = Product(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        name="Test Məhsul",
        sku=f"SKU-{uuid.uuid4().hex[:8]}",
        is_active=True,
    )
    db_session.add(p)
    await db_session.commit()
    return p


@pytest_asyncio.fixture
async def variant(
    db_session: AsyncSession, tenant: Tenant, product: Product
) -> ProductVariant:
    v = ProductVariant(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        product_id=product.id,
        sku=f"VAR-{uuid.uuid4().hex[:8]}",
        name="Default Variant",
        price=10.00,
    )
    db_session.add(v)
    await db_session.commit()
    return v


@pytest.fixture
def auth_token(admin_user: User) -> str:
    return create_access_token(
        subject=str(admin_user.id),
        extra={
            "role": admin_user.role.value,
            "tenant_id": str(admin_user.tenant_id),
        },
    )


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    return {"Authorization": f"Bearer {auth_token}"}
