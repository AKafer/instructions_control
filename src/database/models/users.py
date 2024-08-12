from fastapi import Depends


from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from database.orm import BaseModel
from dependencies import get_db_session


class User(SQLAlchemyBaseUserTableUUID, BaseModel):
    pass


async def get_user_db(session: AsyncSession = Depends(get_db_session)):
    yield SQLAlchemyUserDatabase(session, User)
