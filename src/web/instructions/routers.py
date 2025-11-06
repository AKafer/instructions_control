import sqlalchemy
from fastapi import File, UploadFile, APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import Response

from database.models import User
from database.models.instructions import Instructions
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from web.exceptions import ErrorSaveToDatabase
from web.instructions.schemas import (
    Instruction,
    InstructionCreateInput,
    InstructionUpdateInput,
    InstructionForUser,
)
from web.instructions.services import (
    get_full_link,
    save_file,
    delete_file,
    update_instruction_in_db,
)
from web.journals.services import remove_lines_to_journals_for_delete_ins
from web.journals.services import get_full_link as get_full_link_signature

from web.users.users import (
    current_superuser,
    current_user,
    current_active_user,
)

router = APIRouter(prefix='/instructions', tags=['insructions'])


@router.get(
    '/',
    response_model=list[Instruction],
    dependencies=[Depends(current_superuser)],
)
async def get_all_instructions(
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Instructions).order_by(Instructions.id.desc())
    inss = await db_session.execute(query)
    ins = inss.scalars().all()
    for instruction in ins:
        if instruction.filename is not None:
            instruction.link = get_full_link(request, instruction.filename)
    return ins


@router.get(
    '/{instruction_id:int}',
    response_model=Instruction,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def get_instruction_by_id(
    request: Request,
    instruction_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Instructions).filter(Instructions.id == instruction_id)
    instruction = await db_session.scalar(query)
    if instruction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Instruction with id {instruction_id} not found',
        )
    if instruction.filename is not None:
        instruction.link = get_full_link(request, instruction.filename)
    return instruction


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def create_instruction(
    request: Request,
    input_data: InstructionCreateInput = Depends(
        InstructionCreateInput.as_form
    ),
    file: UploadFile = File(...),
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        db_instruction = Instructions(**input_data.dict())
        db_instruction.filename = None
        db_session.add(db_instruction)
        await db_session.commit()
        await db_session.refresh(db_instruction)
        if file is not None:
            file_name = await save_file(file, db_instruction)
            db_instruction.filename = file_name
            await db_session.commit()
            await db_session.refresh(db_instruction)
            if db_instruction.filename is not None:
                db_instruction.link = get_full_link(request, db_instruction.filename)
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Instruction with this title already exists: {e}',
        )
    return db_instruction


@router.patch(
    '/{instruction_id:int}',
    response_model=Instruction,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def update_instruction(
    request: Request,
    instruction_id: int,
    update_data: InstructionUpdateInput = Depends(
        InstructionUpdateInput.as_form
    ),
    file: UploadFile = File(None),
    db_session: AsyncSession = Depends(get_db_session),
):
    update_dict = update_data.dict(exclude_none=True)
    query = select(Instructions).filter(Instructions.id == instruction_id)
    instruction = await db_session.scalar(query)
    if instruction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Instruction with id {instruction_id} not found',
        )
    try:
        db_instruction = await update_instruction_in_db(
            db_session, instruction, **update_dict
        )
        if file is not None:
            new_filename = await save_file(file, db_instruction)
            db_instruction.filename = new_filename
        await db_session.commit()
        await db_session.refresh(db_instruction)
        if db_instruction.filename is not None:
            db_instruction.link = get_full_link(request, db_instruction.filename)
    except ErrorSaveToDatabase as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Instruction with this title already exists: {e}',
        )
    return db_instruction


@router.delete(
    '/{instruction_id:int}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def delete_instruction(
    instruction_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Instructions).filter(Instructions.id == instruction_id)
    instruction = await db_session.scalar(query)
    if instruction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Instruction with id {instruction_id} not found',
        )
    filename = instruction.filename
    await remove_lines_to_journals_for_delete_ins(db_session, instruction_id)
    await db_session.delete(instruction)
    await db_session.commit()
    if filename is not None:
        delete_file(filename)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    '/get_my_instructions/',
    response_model=list[InstructionForUser] | dict,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_user)],
)
async def get_my_instructions(
    request: Request,
    user: User = Depends(current_active_user),
):
    if user.is_superuser:
        return {'detail': 'This endpoint is only for users'}
    instructions = list(user.instructions)
    instructions_for_show = []
    for instruction in instructions:
        if instruction.filename is not None:
            instruction.link = get_full_link(request, instruction.filename)
        instruction.journal = None
        for journal in instruction.journals:
            if journal.user_uuid == user.id:
                if journal.signature is not None:
                    journal.link = get_full_link_signature(request, journal.signature)
                instruction.journal = journal
                break
        if instruction.journal.actual:
            instructions_for_show.append(instruction)
    return instructions_for_show
