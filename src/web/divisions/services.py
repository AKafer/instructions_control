from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Divisions


async def update_division(
        db_session: AsyncSession,
        division: Divisions,
        **update_data: dict
) -> Divisions:
    for field, value in update_data.items():
        setattr(division, field, value)
    await db_session.commit()
    await db_session.refresh(division)
    return division