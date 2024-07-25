from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Professions


async def update_profession(
        db_session: AsyncSession,
        profession: Professions,
        **update_data: dict
) -> Professions:
    for field, value in update_data.items():
        setattr(profession, field, value)
    await db_session.commit()
    await db_session.refresh(profession)
    return profession
