import sqlalchemy
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Instructions, Professions
from database.models.rules import Rules
from web.exceptions import DuplicateError, ItemNotFound
from web.rules.exceptions import BindToManyError


async def check_constraints(
    db_session: AsyncSession,
    profession_id: int,
    instruction_id: int,
) -> None:
    query = select(Professions).filter(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise ItemNotFound(f'Profession with id {profession_id} not found')
    query = select(Instructions).filter(Instructions.id == instruction_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise ItemNotFound(f'Instruction with id {instruction_id} not found')
    query = select(Rules).where(
        and_(
            Rules.profession_id == profession_id,
            Rules.instruction_id == instruction_id,
        )
    )
    rule = await db_session.scalar(query)
    if rule is not None:
        raise DuplicateError(
            f'Rule with profession_id {profession_id} and instruction_id {instruction_id} already exists'
        )


async def bind_to_many_professions(
    db_session: AsyncSession,
    instruction_id: int,
    profession_ids: list[int] | None,
    bind_to_all: bool = False,
) -> None:
    query = select(Instructions).filter(Instructions.id == instruction_id)
    instruction = await db_session.scalar(query)
    if instruction is None:
        raise BindToManyError(
            f'Instruction with id {instruction_id} not found'
        )
    if bind_to_all:
        query = select(Professions.id)
        result = await db_session.scalars(query)
        profession_ids = list(set(result.all()))
    else:
        if profession_ids is None:
            raise BindToManyError('profession_ids must be provided')
    query = select(Rules.profession_id).where(
        Rules.instruction_id == instruction_id
    )
    result = await db_session.scalars(query)
    already_binded_professions = list(set(result.all()))

    try:
        for profession_id in profession_ids:
            if profession_id in already_binded_professions:
                continue
            rule = Rules(
                profession_id=profession_id,
                instruction_id=instruction_id,
            )
            db_session.add(rule)
        await db_session.commit()
    except sqlalchemy.exc.IntegrityError as e:
        raise BindToManyError(f'Error while save rules to database {e}')
