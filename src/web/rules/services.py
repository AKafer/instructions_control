from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Professions, Instructions
from database.models.rules import Rules
from web.exceptions import ItemNotFound, DuplicateError


async def check_constraints(
        profession_id: int,
        instruction_id: int,
        db_session: AsyncSession,
) -> None:
    query = select(Professions).filter(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise ItemNotFound(f"Profession with id {profession_id} not found")
    query = select(Instructions).filter(Instructions.id == instruction_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise ItemNotFound(f"Instruction with id {instruction_id} not found")
    query = select(Rules).where(
        and_(Rules.profession_id == profession_id, Rules.instruction_id == instruction_id)
    )
    rule = await db_session.scalar(query)
    if rule is not None:
        raise DuplicateError(f"Rule with instruction_id {instruction_id} and profession_id {profession_id} already exists")
