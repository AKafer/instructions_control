from sqlalchemy.ext.asyncio import AsyncSession

from database.orm import Session


async def get_db_session() -> AsyncSession:
    async with Session() as session:
        yield session
