from fastapi import Depends, APIRouter
from sqlalchemy import select
from fastapi_pagination import Page
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_pagination.ext.sqlalchemy import paginate

from database.models.journals import Journals
from dependencies import get_db_session
from web.journals.shemas import Journal

router = APIRouter(prefix="/journals", tags=["journals"])


@router.get("/", response_model=Page[Journal])
async def get_all_rules(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Journals).order_by(Journals.id.desc())
    return await paginate(db_session, query)
