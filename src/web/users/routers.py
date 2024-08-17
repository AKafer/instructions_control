from fastapi import APIRouter, Depends
from fastapi_pagination import Page
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_pagination.ext.sqlalchemy import paginate

from database.models import User
from dependencies import get_db_session
from web.users.filters import UsersFilter
from web.users.schemas import UserRead
from web.users.users import current_superuser

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(current_superuser)])


@router.get("/", response_model=Page[UserRead])
async def get_all_users(
    user_filter: UsersFilter = Depends(UsersFilter),
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(User).order_by(User.created_at)
    query = user_filter.filter(query)
    return await paginate(db_session, query)
