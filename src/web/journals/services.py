import uuid
from datetime import datetime

from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User, Journals, Instructions
from database.orm import Session
from web.instructions.services import get_instruction_by_profession_from_db


async def get_or_create_journals(
    db_session: AsyncSession,
    instructions_ids: list[int],
    user_uuid: uuid
):
    query = select(Journals).where(Journals.user_uuid == user_uuid)
    journals = await db_session.scalars(query)
    exist_instructions_ids = []
    list_to_delete = []
    for journal in journals:
        if journal.instruction_id not in instructions_ids:
            list_to_delete.append(journal.id)
        else:
            journal.last_date_read = datetime.utcnow()
            exist_instructions_ids.append(journal.instruction_id)
    if list_to_delete:
        query = delete(Journals).where(Journals.id.in_(list_to_delete))
        await db_session.execute(query)
    list_to_create = list(set(instructions_ids) - set(exist_instructions_ids))
    for instruction_id in list_to_create:
        journal = Journals(instruction_id=instruction_id, user_uuid=user_uuid)
        db_session.add(journal)
    await db_session.commit()


async def add_lines_to_journals(
    user: User
) -> None:
    async with Session() as session:
        if user.profession is not None:
            instructions = await get_instruction_by_profession_from_db(session, user.profession)
            ins_ids = [instruction.id for instruction in instructions]
            await get_or_create_journals(session, ins_ids, user.id)


async def add_params_to_jornals(
    db_session: AsyncSession,
    paginate_response,
):
    ins_ids = [journal.instruction_id for journal in paginate_response.items]
    query = select(Instructions).where(Instructions.id.in_(ins_ids))
    instructions = await db_session.scalars(query)
    period_dict = {instruction.id: instruction.period for instruction in instructions}
    for journal in paginate_response.items:
        date_diff = (datetime.utcnow().replace(tzinfo=None) - journal.last_date_read.replace(tzinfo=None)).days
        if date_diff > period_dict[journal.instruction_id]:
            journal.valid = False
            journal.remain_days = 0
        else:
            journal.valid = True
            journal.remain_days = period_dict[journal.instruction_id] - date_diff
    return paginate_response

