from datetime import datetime

from fastapi import Depends, APIRouter, UploadFile, File, Request
from sqlalchemy import select, and_
from fastapi_pagination import Page
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_pagination.ext.sqlalchemy import paginate
from starlette import status
from starlette.exceptions import HTTPException

from database.models import User
from database.models.journals import Journals
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from web.journals.services import add_params_to_jornals, save_file
from web.journals.shemas import Journal
from web.users.users import current_user, current_superuser

router = APIRouter(prefix="/journals", tags=["journals"])


@router.get("/", response_model=Page[Journal], dependencies=[Depends(current_superuser)])
async def get_all_journals(
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Journals).order_by(Journals.id.desc())
    response = await paginate(db_session, query)
    journals = await add_params_to_jornals(db_session, request, response)
    return journals


@router.patch(
    "/update_journal/{instruction_id:int}",
    response_model=dict,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_user)])
async def update_journal(
    instruction_id: int,
    file: UploadFile = File(None),
    db_session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user)
):
    query = (
        select(Journals)
        .where(
            and_(
                Journals.user_uuid == user.id,
                Journals.instruction_id == instruction_id
            )
        )
    )
    journal = await db_session.scalar(query)
    if journal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal for this user and  instruction_id {instruction_id} not found",
        )
    journal.last_date_read = datetime.utcnow()
    if file is not None:
        journal.signature = await save_file(
            new_file=file,
            journal=journal,
            user=user
        )
    await db_session.commit()
    return {"detail": "Journal updated"}
