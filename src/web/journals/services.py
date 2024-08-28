import os
import uuid
from datetime import datetime

import aiofiles as aiof
from fastapi import UploadFile, Request
from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Instructions, Journals, User
from database.orm import Session
from settings import (
    SIGNATURES_DIR,
    BASE_URL,
    STATIC_FOLDER,
    SIGNATURES_FOLDER,
)


async def get_or_create_journals(
    db_session: AsyncSession, instructions_ids: list[int], user_uuid: uuid
):
    query = select(Journals).where(Journals.user_uuid == user_uuid)
    journals = await db_session.scalars(query)
    exist_instructions_ids = []
    list_to_delete = []
    for journal in journals:
        if journal.instruction_id not in instructions_ids:
            list_to_delete.append(journal.id)
        else:
            # journal.last_date_read = datetime.utcnow()
            exist_instructions_ids.append(journal.instruction_id)
    if list_to_delete:
        query = delete(Journals).where(Journals.id.in_(list_to_delete))
        await db_session.execute(query)
    list_to_create = list(set(instructions_ids) - set(exist_instructions_ids))
    for instruction_id in list_to_create:
        journal = Journals(instruction_id=instruction_id, user_uuid=user_uuid)
        db_session.add(journal)
    await db_session.commit()


async def actualize_journals_for_user(user: User) -> None:
    async with Session() as session:
        print(f'Actualize journals for user {user.id}')
        print(f'User profession id: {user.profession_id}')
        if user.profession_id is not None:
            ins_ids = [instruction.id for instruction in user.profession.instructions]
            await get_or_create_journals(session, ins_ids, user.id)


def get_full_link(request: Request, filename: str) -> str:
    base_url = BASE_URL or str(request.base_url)
    return f'{base_url}{STATIC_FOLDER}/{SIGNATURES_FOLDER}/{filename}'


async def add_params_to_jornals(
    db_session: AsyncSession,
    request: Request,
    paginate_response,
):
    ins_ids = [journal.instruction_id for journal in paginate_response.items]
    query = select(Instructions).where(Instructions.id.in_(ins_ids))
    instructions = await db_session.scalars(query)
    period_dict = {instruction.id: instruction for instruction in instructions}
    for journal in paginate_response.items:
        if journal.signature is not None:
            journal.signature = get_full_link(request, journal.signature)
        if journal.last_date_read is None:
            journal.valid = False
            journal.remain_days = 0
        else:
            if period_dict[journal.instruction_id].iteration:
                date_diff = (
                    datetime.utcnow().replace(tzinfo=None)
                    - journal.last_date_read.replace(tzinfo=None)
                ).days
                if date_diff > period_dict[journal.instruction_id].period:
                    journal.valid = False
                    journal.remain_days = 0
                else:
                    journal.valid = True
                    journal.remain_days = (
                        period_dict[journal.instruction_id].period - date_diff
                    )
            else:
                journal.valid = True
                journal.remain_days = 0
    return paginate_response


async def add_lines_to_journals_for_new_rule(
    db_session: AsyncSession, profession_id: int, instruction_id: int
) -> None:
    query = select(User.id).where(User.profession == profession_id)
    users_ids = await db_session.scalars(query)
    for user_id in users_ids:
        journal = Journals(user_uuid=user_id, instruction_id=instruction_id)
        db_session.add(journal)
    await db_session.commit()


async def remove_lines_to_journals_for_delete_rule(
    db_session: AsyncSession, profession_id: int, instruction_id: int
) -> None:
    query = select(User.id).where(User.profession == profession_id)
    users_ids = await db_session.scalars(query)
    query = select(Journals).where(
        and_(
            Journals.user_uuid.in_(users_ids),
            Journals.instruction_id == instruction_id,
        )
    )
    await delete_journals(db_session, query)


async def remove_lines_to_journals_for_delete_ins(
    db_session: AsyncSession, instruction_id: int
) -> None:

    query = select(Journals).where(Journals.instruction_id == instruction_id)
    await delete_journals(db_session, query)


async def remove_lines_to_journals_for_delete_user(user: User) -> None:
    async with Session() as db_session:
        query = select(Journals).where(Journals.user_uuid == user.id)
        await delete_journals(db_session, query)


async def delete_journals(db_session: AsyncSession, query) -> None:
    journals = (await db_session.scalars(query)).all()
    await delete_files_from_journals(journals)
    ids = [journal.id for journal in journals]
    query = delete(Journals).where(Journals.id.in_(ids))
    await db_session.execute(query)
    await db_session.commit()


async def save_file(
    new_file: UploadFile, journal: Journals, user: User
) -> str:
    if journal.signature:
        await delete_file(journal.signature)
    _, suffix = os.path.splitext(new_file.filename)
    new_name = (
        f'{user.id}--{journal.id}--'
        f"{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')}{suffix}"
    )
    path_to_file = os.path.join(SIGNATURES_DIR, new_name)
    async with aiof.open(path_to_file, 'wb+') as f:
        await f.write(new_file.file.read())
    return new_name


async def delete_files_from_journals(journals) -> None:
    for journal in journals:
        if journal.signature:
            print(f'Delete signature {journal.signature}')
            await delete_file(journal.signature)


async def delete_file(filename: str) -> None:
    try:
        os.remove(os.path.join(SIGNATURES_DIR, filename))
    except FileNotFoundError:
        pass
