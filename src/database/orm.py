from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_POOL_MAX_OVERFLOW
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BaseModel = declarative_base()
