import os

from fastapi import File, UploadFile, APIRouter, Depends, Request
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import Response

from database.models import User
from database.models.instructions import Instructions
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from settings import UPLOAD_DIR
from web.exceptions import ItemNotFound, DuplicateFilename, ErrorSaveToDatabase
from web.instructions.schemas import Instruction, InstructionCreateInput, InstructionUpdateInput, InstructionForUser
from web.instructions.services import (
    get_full_link,
    save_file,
    delete_file,
    get_instruction_by_profession_from_db,
    update_instruction_logic, add_params_to_instruction
)

from web.users.users import current_superuser, current_user

router = APIRouter(prefix="/instructions", tags=["insructions"])


@router.get(
    "/",
    response_model=Page[Instruction],
    dependencies=[Depends(current_superuser)]
)
async def get_all_instructions(
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Instructions).order_by(Instructions.id.desc())
    ins = await paginate(db_session, query)
    for instruction in ins.items:
        if instruction.filename is not None:
            instruction.filename = get_full_link(request, instruction.filename)
    return ins


@router.get(
    "/{instruction_id:int}",
    response_model=Instruction,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)]
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
            detail=f"Instruction with id {instruction_id} not found",
        )
    if instruction.filename is not None:
        instruction.filename = get_full_link(request, instruction.filename)
    return instruction

@router.get(
    "/get_by_profession/{profession_id:int}",
    response_model=list[Instruction],
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)]
)
async def get_instructions_by_profession(
    request: Request,
    profession_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        instructions = await get_instruction_by_profession_from_db(db_session, profession_id)
    except ItemNotFound as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    for instruction in instructions:
        if instruction.filename is not None:
            instruction.filename = get_full_link(request, instruction.filename)
    return instructions


@router.post(
    "/",
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)]
)
async def create_instruction(
    request: Request,
    input_data: InstructionCreateInput = Depends(InstructionCreateInput.as_form),
    file: UploadFile = File(...),
    db_session: AsyncSession = Depends(get_db_session),
):
    db_instruction = Instructions(**input_data.dict())
    db_instruction.filename = None
    if file is not None:
        if file.filename in os.listdir(UPLOAD_DIR):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File with name {file.filename} already exists",
            )
        db_instruction.filename = file.filename
    db_session.add(db_instruction)
    await db_session.commit()
    await db_session.refresh(db_instruction)
    if file is not None:
        await save_file(file)
        db_instruction.filename = get_full_link(request, file.filename)
    return db_instruction


@router.patch(
    "/{instruction_id:int}",
    response_model=Instruction,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)]
)
async def update_instruction(
    request: Request,
    instruction_id: int,
    update_data: InstructionUpdateInput = Depends(InstructionUpdateInput.as_form),
    file: UploadFile = File(None),
    db_session: AsyncSession = Depends(get_db_session),
):
    update_dict = update_data.dict(exclude_none=True)
    query = select(Instructions).filter(Instructions.id == instruction_id)
    instruction = await db_session.scalar(query)
    if instruction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instruction with id {instruction_id} not found",
        )
    try:
        db_instruction = await update_instruction_logic(
            db_session=db_session,
            instruction=instruction,
            update_dict=update_dict,
            file=file,
            request=request
        )
    except (DuplicateFilename, ErrorSaveToDatabase) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return db_instruction


@router.delete(
    "/{instruction_id:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)]
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
            detail=f"Instruction with id {instruction_id} not found",
        )
    filename = instruction.filename
    await db_session.delete(instruction)
    await db_session.commit()
    delete_file(filename)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/get_my_instructions/",
    response_model=list[InstructionForUser],
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_user)]
)
async def get_my_instructions(
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user)
):
    response = await get_instruction_by_profession_from_db(db_session, user.profession)
    for instruction in response:
        if instruction.filename is not None:
            instruction.filename = get_full_link(request, instruction.filename)
    instructions = await add_params_to_instruction(db_session, user, response)
    return instructions


