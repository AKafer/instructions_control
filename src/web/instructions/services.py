import os
from datetime import datetime

import sqlalchemy
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import Request, UploadFile
from database.models import Instructions, Professions, Journals, User
from database.models.rules import Rules
from settings import BASE_URL, UPLOAD_DIR

import aiofiles as aiof

from web.exceptions import ErrorSaveToDatabase, DuplicateFilename, ItemNotFound


async def update_instruction_in_db(
        db_session: AsyncSession,
        instruction: Instructions,
        **update_data: dict
) -> Instructions:
    for field, value in update_data.items():
        setattr(instruction, field, value)
    try:
        await db_session.commit()
    except sqlalchemy.exc.IntegrityError as e:
        raise ErrorSaveToDatabase(f"Error save to database {e}")
    await db_session.refresh(instruction)
    return instruction


async def update_instruction_logic(
    db_session: AsyncSession,
    request: Request,
    instruction: Instructions,
    update_dict: dict,
    file: UploadFile = None,
):
    old_filename = instruction.filename
    if file is not None:
        if file.filename in os.listdir(UPLOAD_DIR) and file.filename != old_filename:
            raise DuplicateFilename(f"File with name {file.filename} already exists")
        if instruction.filename != file.filename:
            update_dict["filename"] = file.filename
        db_instruction = await update_instruction_in_db(db_session, instruction, **update_dict)
        await save_file(file)
        if old_filename is not None and old_filename != file.filename:
            delete_file(old_filename)
        db_instruction.filename = get_full_link(request, file.filename)
    else:
        db_instruction = await update_instruction_in_db(db_session, instruction, **update_dict)
        db_instruction.filename = get_full_link(request, old_filename)
    return db_instruction


def get_full_link(request: Request, filename: str) -> str:
    base_url = BASE_URL or str(request.base_url)
    return f"{base_url}static/{filename}"


async def save_file(file: UploadFile) -> None:
    path_to_file = os.path.join(UPLOAD_DIR, file.filename)
    async with aiof.open(path_to_file, "wb+") as f:
        await f.write(file.file.read())


def delete_file(filename: str) -> None:
    try:
        os.remove(os.path.join(UPLOAD_DIR, filename))
    except FileNotFoundError:
        pass


async def get_instruction_by_profession_from_db(
    db_session: AsyncSession,
    profession_id: int,
) -> list[Instructions]:
    query = select(Professions).where(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise ItemNotFound(f"Profession with id {profession_id} not found")
    subquery = select(Rules.instruction_id).where(Rules.profession_id == profession_id)
    query = select(Instructions).where(Instructions.id.in_(subquery))
    instructions = await db_session.scalars(query)
    return instructions.all()


async def add_params_to_instruction(
    db_session: AsyncSession,
    user: User,
    response
):
    query = select(Journals).where(Journals.user_uuid == user.id)
    journals = await db_session.scalars(query)
    for instruction in response:
        for journal in journals:
            if instruction.id == journal.instruction_id:
                date_diff = (datetime.utcnow().replace(tzinfo=None) - journal.last_date_read.replace(tzinfo=None)).days
                if date_diff > instruction.period:
                    instruction.valid = False
                    instruction.remain_days = 0
                else:
                    instruction.valid = True
                    instruction.remain_days = instruction.period - date_diff
    return response
