import os

from fastapi import File, UploadFile, APIRouter, Depends, Request
from fastapi.responses import FileResponse
from fastapi_pagination import paginate, Page
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import Response, PlainTextResponse

from database.models.instructions import Instructions
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from settings import UPLOAD_DIR
from web.instructions.schemas import Instruction, InstructionInput
from web.instructions.services import update_instruction

router = APIRouter(prefix="/instructions", tags=["insructions"])


@router.get("/", response_model=Page[Instruction])
async def get_all_instructions(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Instructions).order_by(Instructions.id.desc())
    instructions = await db_session.execute(query)
    return paginate(instructions.scalars().all())


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
    return instruction


@router.post("/", response_model=Instruction)
async def create_instruction(
    input_data: InstructionInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    db_instruction = Instructions(**input_data.dict())
    db_session.add(db_instruction)
    await db_session.commit()
    await db_session.refresh(db_instruction)
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
    instruction_id: int,
    update_input: InstructionInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Instructions).filter(Instructions.id == instruction_id)
    instruction = await db_session.scalar(query)
    if instruction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profssion with id {instruction_id} not found",
        )
    return await update_instruction(db_session, instruction, **update_input.dict())


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
            detail=f"Profssion with id {instruction_id} not found",
        )
    await db_session.delete(instruction)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post('/upload')
def upload(file: UploadFile = File(...)):
    SAVE_F = os.path.join(UPLOAD_DIR, file.filename)
    with open(SAVE_F, "wb+") as f:
        f.write(file.file.read())
    return FileResponse(path=SAVE_F, media_type="application/octet-stream")


@router.get("/get_link", response_class=PlainTextResponse)
def get_link(request: Request, file_number: int = 0):
    if not os.listdir(UPLOAD_DIR):
        return "No files uploaded"
    if file_number >= len(os.listdir(UPLOAD_DIR)):
        return "File not found"
    filename = os.listdir(UPLOAD_DIR)[file_number]
    return f"{str(request.base_url)}static/{filename}"


@router.get("/fileslist")
def get_file_list():
    return os.listdir(UPLOAD_DIR)
