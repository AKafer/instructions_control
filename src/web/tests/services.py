from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Tests


async def update_test_in_db(
        db_session: AsyncSession,
        test: Tests,
        **update_data: dict
) -> Tests:
    for field, value in update_data.items():
        setattr(test, field, value)
    await db_session.commit()
    await db_session.refresh(test)
    return test