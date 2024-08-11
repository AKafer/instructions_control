import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import Request, UploadFile
from database.models import Instructions, Professions
from database.models.rules import Rules
from settings import BASE_URL, UPLOAD_DIR

import aiofiles as aiof

from web.rules.exceptions import ItemNotFound


async def update_instruction_in_db(
        db_session: AsyncSession,
        instruction: Instructions,
        **update_data: dict
) -> Instructions:
    for field, value in update_data.items():
        setattr(instruction, field, value)
    await db_session.commit()
    await db_session.refresh(instruction)
    return instruction


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
    profession_id: int,
    db_session: AsyncSession,
) -> list[Instructions]:
    query = select(Professions).where(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise ItemNotFound(f"Profession with id {profession_id} not found")
    subquery = select(Rules.instruction_id).where(Rules.profession_id == profession_id)
    query = select(Instructions).where(Instructions.id.in_(subquery))
    instructions = await db_session.scalars(query)
    return instructions.all()
