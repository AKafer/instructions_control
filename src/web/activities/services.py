from sqlalchemy.ext.asyncio import AsyncSession

from database.models.activities import Activities


async def update_activity_db(
    db_session: AsyncSession, activity: Activities, **update_data: dict
) -> Activities:
    for field, value in update_data.items():
        setattr(activity, field, value)
    await db_session.commit()
    await db_session.refresh(activity)
    return activity
