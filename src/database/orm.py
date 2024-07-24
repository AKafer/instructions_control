from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_POOL_MAX_OVERFLOW
)
Session = sessionmaker(autocommit=False, class_=AsyncSession, bind=engine)

BaseModel = declarative_base()
