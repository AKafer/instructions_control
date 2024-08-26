import os
from datetime import datetime

import sqlalchemy
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import Request, UploadFile
from database.models import Instructions, Professions, Journals, User
from database.models.rules import Rules
from settings import (
    BASE_URL,
    INSTRUCTIONS_DIR,
    STATIC_FOLDER,
    INSTRUCTIONS_FOLDER,
)

import aiofiles as aiof

from web.exceptions import ErrorSaveToDatabase, DuplicateFilename, ItemNotFound


async def update_instruction_in_db(
    db_session: AsyncSession, instruction: Instructions, **update_data: dict
) -> Instructions:
    for field, value in update_data.items():
        setattr(instruction, field, value)
    try:
        await db_session.commit()
    except sqlalchemy.exc.IntegrityError as e:
        raise ErrorSaveToDatabase(f'Error save to database {e}')
    await db_session.refresh(instruction)
    return instruction


def get_full_link(request: Request, filename: str) -> str:
    base_url = BASE_URL or str(request.base_url)
    return f'{base_url}{STATIC_FOLDER}/{INSTRUCTIONS_FOLDER}/{filename}'


async def save_file(new_file: UploadFile, instruction: Instructions) -> str:
    if instruction.filename is not None:
        delete_file(instruction.filename)
    _, suffix = os.path.splitext(new_file.filename)
    new_name = (
        f'{instruction.id}--'
        f"{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')}{suffix}"
    )
    path_to_file = os.path.join(INSTRUCTIONS_DIR, new_name)
    async with aiof.open(path_to_file, 'wb+') as f:
        await f.write(new_file.file.read())
    return new_name


def delete_file(filename: str) -> None:
    print(f'Delete file {filename}')
    try:
        os.remove(os.path.join(INSTRUCTIONS_DIR, filename))
    except FileNotFoundError:
        pass

# async def add_params_to_instruction(
#     db_session: AsyncSession, user: User, response
# ):
#     from web.journals.services import actualize_journals_for_user
#
#     await actualize_journals_for_user(user)
#     query = select(Journals).where(Journals.user_uuid == user.id)
#     journals = (await db_session.scalars(query)).all()
#     for instruction in response:
#         for journal in journals:
#             if instruction.id == journal.instruction_id:
#                 if journal.last_date_read is None:
#                     instruction.valid = False
#                     instruction.remain_days = 0
#                 else:
#                     if instruction.iteration:
#                         date_diff = (
#                             datetime.utcnow().replace(tzinfo=None)
#                             - journal.last_date_read.replace(tzinfo=None)
#                         ).days
#                         if date_diff > instruction.period:
#                             instruction.valid = False
#                             instruction.remain_days = 0
#                         else:
#                             instruction.valid = True
#                             instruction.remain_days = (
#                                 instruction.period - date_diff
#                             )
#                     else:
#                         instruction.valid = True
#                         instruction.remain_days = 0
#     return response
