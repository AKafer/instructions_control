import sqlalchemy
from fastapi import APIRouter, Depends, Request, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models import TrainingModules
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.trainig_modules.schemas import TrainingModule, TrainingModuleCreateInput, TrainingModuleUpdateInput
from web.trainig_modules.services import get_full_link, save_file, update_tm_in_db, delete_file, check_index, \
    DuplicateIndexError
from web.users.users import current_superuser

router = APIRouter(
    prefix='/training_modules',
    tags=['training_modules'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/get_modules_for_instruction/{instruction_id:int}', response_model=list[TrainingModule])
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
    for tm in training_modules:
        if tm.filename is not None:
            tm.link = get_full_link(request, tm.filename)
    return training_modules


@router.get(
    '/{training_module_id:int}',
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
    if tm.filename is not None:
        tm.link = get_full_link(request, tm.filename)
    return tm


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
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
