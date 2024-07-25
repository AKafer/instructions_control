from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Instructions


async def update_instruction(
        db_session: AsyncSession,
        instruction: Instructions,
        **update_data: dict
) -> Instructions:
    for field, value in update_data.items():
        setattr(instruction, field, value)
    await db_session.commit()
    await db_session.refresh(instruction)
    return instruction
