from datetime import datetime
from io import BytesIO

from fastapi import Depends, APIRouter, UploadFile, File, Request
from openpyxl import Workbook
from sqlalchemy import select, and_, update
from fastapi_pagination import Page
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_pagination.ext.sqlalchemy import paginate
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import StreamingResponse

from database.models import User, Histories
from database.models.journals import Journals
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from web.exceptions import BulkChecksError
from web.journals.filters import JornalsFilter
from web.journals.services import save_file, collect_full_links, check_for_bulk_operation
from web.journals.shemas import Journal, BulkUpdateJournalsInput
from web.users.users import current_user, current_superuser

router = APIRouter(prefix='/journals', tags=['journals'])


@router.get(
    '/{journal_id:int}',
    response_model=Journal,
    dependencies=[Depends(current_superuser)],
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_journal_by_id(
    journal_id: int,
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = (
        select(Journals)
        .where(Journals.id == journal_id)
        .order_by(Journals.id.desc())
    )
    journal = await db_session.scalar(query)
    if journal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Journal with id {journal_id} not found',
        )
    collect_full_links(journal, request)
    return journal


@router.get(
    '/',
    response_model=Page[Journal],
    dependencies=[Depends(current_superuser)],
)
async def get_all_journals(
    request: Request,
    journals_filter: JornalsFilter = Depends(JornalsFilter),
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Journals).order_by(Journals.id.desc())
    query = journals_filter.filter(query)
    response = await paginate(db_session, query)
    for journal in response.items:
        collect_full_links(journal, request)
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
            detail=f'Journal for this user and instruction_id {instruction_id} not found',
        )
    journal.last_date_read = datetime.utcnow()
    history = Histories(
        user_uuid=user.id,
        journal_id=journal.id,
        date=datetime.utcnow(),
        instruction_title=journal.instruction.title,
    )
    if file is not None:
        generated_filename = await save_file(new_file=file, journal=journal, user=user)
        journal.signature = generated_filename
        history.signature = generated_filename
    db_session.add(history)
    await db_session.commit()
    return {'detail': 'Journal updated'}


@router.patch(
    '/bulk_update_journals',
    response_model=dict,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def bulk_update_journals(
    update_input: BulkUpdateJournalsInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        await check_for_bulk_operation(db_session, update_input)
    except BulkChecksError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Bulk update error: {str(e)}'
        )
    query = (
        select(Journals)
        .where(
            and_(
                Journals.instruction_id == update_input.instruction_id,
                Journals.user_uuid.in_(update_input.user_uuids_list),
            )
        )
    )
    journals = await db_session.scalars(query)
    i = 0
    for journal in journals:
        journal.last_date_read = datetime.utcnow()
        history = Histories(
            user_uuid=journal.user_uuid,
            journal_id=journal.id,
            date=datetime.utcnow(),
            instruction_title=journal.instruction.title,
        )
        db_session.add(history)
        i += 1
    await db_session.commit()
    return {'detail': f'{i} journals updated'}


@router.get(
    '/download_excel',
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def download_excel(
    user: User = Depends(current_user),
):
    wb = Workbook()
    ws = wb.active

    ws.append(['id', 'user_uuid', 'instruction_id', 'last_date_read', 'signature'])
    ws.append(['1', 'xxxxxxxxxxx', '15', '2024-10-10', 'file.jpg'])

    excel_io = BytesIO()
    wb.save(excel_io)
    excel_io.seek(0)

    return StreamingResponse(
        BytesIO(excel_io.getvalue()),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename="journals.xlsx"'}
    )