from datetime import datetime

from fastapi import Depends, APIRouter, UploadFile, File, Request
from sqlalchemy import select, and_
from fastapi_pagination import Page
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_pagination.ext.sqlalchemy import paginate
from starlette import status
from starlette.exceptions import HTTPException

from database.models import User, Histories
from database.models.journals import Journals
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from web.journals.services import save_file, get_full_link
from web.journals.shemas import Journal
from web.users.users import current_user, current_superuser
from web.instructions.services import get_full_link as get_full_link_ins

router = APIRouter(prefix='/journals', tags=['journals'])


@router.get(
    '/',
    response_model=Page[Journal],
    dependencies=[Depends(current_superuser)],
)
async def get_all_journals(
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Journals).where(Journals.actual == True).order_by(Journals.id.desc())
    response = await paginate(db_session, query)
    for journal in response.items:
        if journal.signature is not None:
            journal.link = get_full_link(request, journal.signature)
        if journal.instruction.filename is not None:
            journal.instruction.link = get_full_link_ins(request, journal.instruction.filename)
        for history in journal.histories:
            if history.signature is not None:
                history.link = get_full_link(request, history.signature)
    return response


@router.patch(
    '/update_journal/{instruction_id:int}',
    response_model=dict,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_user)],
)
async def update_journal(
    instruction_id: int,
    file: UploadFile = File(None),
    db_session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user),
):
    query = select(Journals).where(
        and_(
            Journals.user_uuid == user.id,
            Journals.instruction_id == instruction_id,
            Journals.actual == True,
        )
    )
    journal = await db_session.scalar(query)
    if journal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Journal for this user and  instruction_id {instruction_id} not found',
        )
    journal.last_date_read = datetime.utcnow()
    history = Histories(user_uuid=user.id, journal_id=journal.id, date=datetime.utcnow())
    if file is not None:
        generated_filename = await save_file(new_file=file, journal=journal, user=user)
        journal.signature = generated_filename
        history.signature = generated_filename

    db_session.add(history)
    await db_session.commit()
    return {'detail': 'Journal updated'}
