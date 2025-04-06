import os
import uuid
from datetime import datetime
from typing import Sequence

import sqlalchemy
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import Request, UploadFile
from database.models import TrainingModules, User, TrainingModuleProgresses, Rules
from settings import (
    BASE_URL,
    STATIC_FOLDER,
    TRAINING_MODULES_FOLDER,
    TRAINING_MODULES_DIR,
)

import aiofiles as aiof

from web.exceptions import ErrorSaveToDatabase
from web.journals.services import logger


class DuplicateIndexError(Exception):
    pass


class ModuleOperationError(Exception):
    pass


async def check_index(db_session: AsyncSession, instruction_id: int, order_index: int) -> bool:
    query = (
        select(TrainingModules)
        .filter(TrainingModules.instruction_id == instruction_id)
        .filter(TrainingModules.order_index == order_index)
    )
    index = await db_session.scalar(query)
    if index:
        raise DuplicateIndexError(f'Index module {order_index} already exists for this instruction')


async def update_tm_in_db(
    db_session: AsyncSession, tm: TrainingModules, **update_data: dict
) -> TrainingModules:
    for field, value in update_data.items():
        setattr(tm, field, value)
    return tm


def get_full_link(request: Request, filename: str) -> str:
    base_url = BASE_URL or str(request.base_url)
    return f'{base_url}api/{STATIC_FOLDER}/{TRAINING_MODULES_FOLDER}/{filename}'


async def save_file(new_file: UploadFile, instruction_id: int, order_index: int) -> str:
    _, suffix = os.path.splitext(new_file.filename)
    new_name = (
        f'{instruction_id}--{order_index}--'
        f"{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')}{suffix}"
    )
    path_to_file = os.path.join(TRAINING_MODULES_DIR, new_name)
    async with aiof.open(path_to_file, 'wb+') as f:
        await f.write(new_file.file.read())
    return new_name


def delete_file(filename: str) -> None:
    logger.debug(f'Delete file {filename}')
    try:
        os.remove(os.path.join(TRAINING_MODULES_DIR, filename))
    except FileNotFoundError:
        pass


async def check_data(
        module_id: int, user_id: str, db_session: AsyncSession
) -> TrainingModules:
    query = select(User).where(User.id == user_id)
    user = await db_session.scalar(query)
    if user is None:
        raise ModuleOperationError('User not found with this id: {}'.format(user_id))
    query = select(TrainingModules).where(TrainingModules.id == module_id)
    module = await db_session.scalar(query)
    if module is None:
        raise ModuleOperationError('Module not found with this id: {}'.format(module_id))
    return module


async def get_users_and_progresses(
    instruction_id: int,
    training_modules: Sequence[TrainingModules],
    db_session: AsyncSession,
) -> (list[User], list[TrainingModuleProgresses]):
    query = select(Rules.profession_id).filter(Rules.instruction_id == instruction_id)
    result = await db_session.execute(query)
    profession_ids = result.scalars().all()
    query = select(User).where(User.profession_id.in_(profession_ids))
    result = await db_session.execute(query)
    users = result.scalars().all()
    query = select(TrainingModuleProgresses).where(
        and_(
            TrainingModuleProgresses.user_id.in_([user.id for user in users]),
            TrainingModuleProgresses.module_id.in_([tm.id for tm in training_modules]),
        )
    )
    result = await db_session.execute(query)
    tm_progresses = result.scalars().all()
    return users, tm_progresses
