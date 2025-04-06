from datetime import datetime

import sqlalchemy
from fastapi import APIRouter, Depends, Request, UploadFile, File
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models import TrainingModules, User, TrainingModuleProgresses, Rules
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.trainig_modules.schemas import TrainingModule, TrainingModuleCreateInput, TrainingModuleUpdateInput, \
    TrainingModuleStatus
from web.trainig_modules.services import get_full_link, save_file, update_tm_in_db, delete_file, check_index, \
    DuplicateIndexError, check_data, ModuleOperationError, get_users_and_progresses
from web.users.users import current_superuser, current_user

router = APIRouter(
    prefix='/training_modules',
    tags=['training_modules'],
)


@router.get(
    '/get_modules_for_instruction/{instruction_id:int}',
    response_model=list[TrainingModule],
    dependencies=[Depends(current_superuser)]
)
async def get_all_training_modules(
    instruction_id: int,
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = (
        select(TrainingModules)
        .filter(TrainingModules.instruction_id == instruction_id)
        .order_by(TrainingModules.order_index)
    )
    result = await db_session.execute(query)
    training_modules = result.scalars().all()
    users, tm_progresses = await get_users_and_progresses(
        instruction_id, training_modules, db_session
    )
    for tm in training_modules:
        passed = 0
        tm.applied = len(users)
        for tmp in tm_progresses:
            if tmp.module_id == tm.id:
                passed += 1 * tmp.is_completed
        tm.passed = passed
        if tm.filename is not None:
            tm.link = get_full_link(request, tm.filename)
    return training_modules


@router.get(
    '/{training_module_id:int}',
    dependencies=[Depends(current_superuser)],
    response_model=TrainingModule,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_training_module_by_id(
    request: Request,
    training_module_id: int,
    db_session: AsyncSession = Depends(get_db_session)
):
    query = select(TrainingModules).filter(TrainingModules.id == training_module_id)
    tm = await db_session.scalar(query)
    if tm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'TrainingModule with id {training_module_id} not found',
        )
    users, tm_progresses = await get_users_and_progresses(
        tm.instruction_id, (tm,), db_session
    )
    if tm.filename is not None:
        passed = 0
        tm.applied = len(users)
        tm.link = get_full_link(request, tm.filename)
        for tmp in tm_progresses:
            if tmp.module_id == tm.id:
                passed += 1 * tmp.is_completed
        tm.passed = passed
    return tm


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(current_superuser)],
    response_model=TrainingModule,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_training_module(
    request: Request,
    training_module_input: TrainingModuleCreateInput = Depends(
        TrainingModuleCreateInput.as_form
    ),
    file: UploadFile = File(...),
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        await check_index(
            db_session,
            training_module_input.instruction_id,
            training_module_input.order_index
        )
    except DuplicateIndexError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    try:
        db_tm = TrainingModules(**training_module_input.dict())
        db_session.add(db_tm)
        if file is not None:
            file_name = await save_file(
                file,
                training_module_input.instruction_id,
                training_module_input.order_index
            )
            db_tm.filename = file_name
        await db_session.commit()
        await db_session.refresh(db_tm)
        if db_tm.filename is not None:
            db_tm.link = get_full_link(request, db_tm.filename)
        return db_tm
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while creating TrainingModule: {e}',
        )


@router.patch(
    '/{training_module_id:int}',
    dependencies=[Depends(current_superuser)],
    response_model=TrainingModule,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_training_module(
    request: Request,
    training_module_id: int,
    training_module_input: TrainingModuleUpdateInput = Depends(
        TrainingModuleUpdateInput.as_form
    ),
    file: UploadFile = File(None),
    db_session: AsyncSession = Depends(get_db_session)
):
    query = select(TrainingModules).where(TrainingModules.id == training_module_id)
    tm = await db_session.scalar(query)
    if tm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'TrainingModule with id {training_module_id} not found',
        )
    tm =  await update_tm_in_db(
        db_session, tm, **training_module_input.dict(exclude_none=True)
    )
    if file is not None:
        if tm.filename is not None:
            delete_file(tm.filename)
        file_name = await save_file(
            file,
            tm.instruction_id,
            tm.order_index
        )
        tm.filename = file_name
    db_session.add(tm)
    await db_session.commit()
    await db_session.refresh(tm)
    if tm.filename is not None:
        tm.link = get_full_link(request, tm.filename)
    return tm


@router.delete(
    '/{training_module_id}',
    dependencies=[Depends(current_superuser)],
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_training_module(
    training_module_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(TrainingModules).filter(TrainingModules.id == training_module_id)
    tm = await db_session.scalar(query)
    if tm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'TrainingModule with id {training_module_id} not found',
        )
    filename = tm.filename
    await db_session.delete(tm)
    await db_session.commit()
    if filename is not None:
        delete_file(filename)
    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.post(
    '/set_module_status',
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(current_user)],
    response_model=TrainingModuleStatus,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def set_module_status(
    request: Request,
    module_id: int,
    is_completed: bool,
    db_session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user),
):
    try:
        module = await check_data(module_id, str(user.id), db_session)
    except ModuleOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    try:
        query = (
            select(TrainingModuleProgresses)
            .where(
                and_(
                    TrainingModuleProgresses.user_id == str(user.id),
                    TrainingModuleProgresses.module_id == module_id,
                )
            )
        )
        tm_progress = await db_session.scalar(query)
        if tm_progress is None:
            tm_progress = TrainingModuleProgresses(
                user_id=str(user.id),
                module_id=module_id,
                is_completed=is_completed,
                completed_at=datetime.utcnow() if is_completed else None,
            )
            db_session.add(tm_progress)
        else:
            tm_progress.is_completed = is_completed
            if is_completed:
                tm_progress.completed_at = datetime.utcnow()
            else:
                tm_progress.completed_at = None
        await db_session.commit()
        return TrainingModuleStatus(
            user_id=str(user.id),
            module_id=module_id,
            module_title=module.title,
            module_description=module.description,
            module_order_index=module.order_index,
            module_link=get_full_link(request, module.filename) if module.filename else None,
            is_completed=tm_progress.is_completed,
            completed_at=tm_progress.completed_at,
        )
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while creating TrainingModuleProgress: {e}',
        )


@router.get(
    '/get_modules_for_user_instruction/{instruction_id:int}',
    response_model=list[TrainingModuleStatus],
    dependencies=[Depends(current_user)]
)
async def get_all_training_modules(
    instruction_id: int,
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user),
):
    query = (
        select(TrainingModules)
        .filter(TrainingModules.instruction_id == instruction_id)
        .order_by(TrainingModules.order_index)
    )
    result = await db_session.execute(query)
    training_modules = result.scalars().all()
    query = (
        select(TrainingModuleProgresses)
        .filter(TrainingModuleProgresses.user_id == str(user.id))
        .filter(TrainingModuleProgresses.module_id.in_([tm.id for tm in training_modules]))
    )
    result = await db_session.execute(query)
    tm_progresses = result.scalars().all()
    tm_status_list = []
    for tm in training_modules:
        tm_progress = next(
            (tm_progress for tm_progress in tm_progresses if tm_progress.module_id == tm.id),
            None
        )
        if tm.filename is not None:
            tm.link = get_full_link(request, tm.filename)
        tm_status = TrainingModuleStatus(
            user_id=str(user.id),
            module_id=tm.id,
            module_title=tm.title,
            module_description=tm.description,
            module_order_index=tm.order_index,
            module_link=tm.link,
            is_completed=tm_progress.is_completed if tm_progress else False,
            completed_at=tm_progress.completed_at if tm_progress else None,
        )
        tm_status_list.append(tm_status)
    return tm_status_list
