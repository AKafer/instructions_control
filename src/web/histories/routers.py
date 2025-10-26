from fastapi import APIRouter, Depends
from fastapi_filter import FilterDepends
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from pygments.styles import material
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Histories
from dependencies import get_db_session
from web.histories.filters import HistoriesFilter
from web.histories.schemas import History
from web.users.users import current_superuser

router = APIRouter(
    prefix='/histories',
    tags=['histories'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[History])
async def get_all_histories(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Histories).order_by(Histories.id.desc())
    histories = await db_session.execute(query)
    return histories.scalars().all()


@router.get('/paginated', response_model=Page[History])
async def get_paginated_histories(
    histories_filter: HistoriesFilter = FilterDepends(HistoriesFilter),
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Histories)
    query = histories_filter.filter(query)
    page = await paginate(db_session, query)
    return page
