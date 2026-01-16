from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

from sqlalchemy import create_engine

def init_db():
    """Create tables synchronously to avoid asyncpg startup issues on Windows."""
    # Create sync engine temporarily
    sync_db_url = settings.database_url.replace("postgresql+asyncpg", "postgresql+psycopg2")
    sync_engine = create_engine(sync_db_url, echo=True)
    
    # Create tables
    Base.metadata.create_all(bind=sync_engine)
    print("Tables created successfully (Sync Mode).")
