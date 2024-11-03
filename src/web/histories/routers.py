from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Histories
from dependencies import get_db_session
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
