import os

from fastapi import File, UploadFile, APIRouter, Depends, Request
from fastapi_pagination import paginate, Page
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import Response

from database.models.instructions import Instructions
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from settings import UPLOAD_DIR
from web.instructions.schemas import Instruction, InstructionInput, InstructionUpdate
from web.instructions.services import (
    get_full_link,
    save_file,
    update_instruction_in_db,
    delete_file
)

router = APIRouter(prefix="/instructions", tags=["insructions"])


@router.get("/", response_model=Page[Instruction])
async def get_all_instructions(
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Instructions).order_by(Instructions.id.desc())
    instructions = await db_session.execute(query)
    ins = instructions.scalars().all()
    for instruction in ins:
        instruction.filename = get_full_link(request, instruction.filename)
    return paginate(ins)


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
            detail=f"Profssion with id {instruction_id} not found",
        )
    instruction.filename = get_full_link(request, instruction.filename)
    return instruction


@router.post(
    "/",
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ResponseErrorBody,
        },
    },
)
async def create_instruction(
    request: Request,
    input_data: InstructionInput = Depends(InstructionInput.as_form),
    file: UploadFile = File(None),
    db_session: AsyncSession = Depends(get_db_session),
):
    if file.filename in os.listdir(UPLOAD_DIR):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File with name {file.filename} already exists",
        )
    db_instruction = Instructions(**input_data.dict())
    db_instruction.filename = file.filename
    db_session.add(db_instruction)
    await db_session.commit()
    await db_session.refresh(db_instruction)
    await save_file(file)
    db_instruction.filename = get_full_link(request, file.filename)
    return db_instruction


@router.put(
    "/{instruction_id:int}",
    response_model=Instruction,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
)
async def update_instruction(
    request: Request,
    instruction_id: int,
    update_data: InstructionUpdate = Depends(InstructionUpdate.as_form),
    file: UploadFile = File(None),
    db_session: AsyncSession = Depends(get_db_session),
):
    del_flag = False
    if file.filename in os.listdir(UPLOAD_DIR):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File with name {file.filename} already exists",
        )
    query = select(Instructions).filter(Instructions.id == instruction_id)
    instruction = await db_session.scalar(query)
    if instruction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profssion with id {instruction_id} not found",
        )
    update_dict = update_data.dict()
    old_filename = instruction.filename
    if file is not None:
        if instruction.filename != file.filename:
            update_dict["filename"] = file.filename
            del_flag = True
    db_instruction = await update_instruction_in_db(db_session, instruction, **update_dict)
    await save_file(file)
    if del_flag:
        delete_file(old_filename)
    db_instruction.filename = get_full_link(request, file.filename)
    return db_instruction


@router.delete(
    "/{instruction_id:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
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


# @router.post('/upload')
# def upload(file: UploadFile = File(...)):
#     SAVE_F = os.path.join(UPLOAD_DIR, file.filename)
#     with open(SAVE_F, "wb+") as f:
#         f.write(file.file.read())
#     return FileResponse(path=SAVE_F, media_type="application/octet-stream")
#
#
# @router.get("/get_link", response_class=PlainTextResponse)
# def get_link(request: Request, file_number: int = 0):
#     if not os.listdir(UPLOAD_DIR):
#         return "No files uploaded"
#     if file_number >= len(os.listdir(UPLOAD_DIR)):
#         return "File not found"
#     filename = os.listdir(UPLOAD_DIR)[file_number]
#     return f"{str(request.base_url)}static/{filename}"
#
#
# @router.get("/fileslist")
# def get_file_list():
#     return os.listdir(UPLOAD_DIR)
