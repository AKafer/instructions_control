import asyncio
import contextlib


from fastapi_users.exceptions import UserAlreadyExists
from sqlalchemy import select

from database.models.users import get_user_db, User
from database.orm import Session
from dependencies import get_db_session
from web.users.schemas import UserCreate
from web.users.users import get_user_manager

get_async_session_context = contextlib.asynccontextmanager(get_db_session)
get_user_db_context = contextlib.asynccontextmanager(get_user_db)
get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)


async def create_user(
        email: str,
        password: str,
        name: str,
        last_name: str,
        profession: int,
        is_superuser: bool
):
    try:
        async with get_async_session_context() as session:
            async with get_user_db_context(session) as user_db:
                async with get_user_manager_context(user_db) as user_manager:
                    user = await user_manager.create(
                        UserCreate(
                            email=email,
                            password=password,
                            name=name,
                            last_name=last_name,
                            is_superuser=is_superuser,
                            profession=profession
                        )
                    )
                    user.is_superuser = True
                    await session.commit()
                    await session.refresh(user)
        print(f"User created {user}")

    except UserAlreadyExists:
        print(f"User {email} already exists")


if __name__ == "__main__":
  asyncio.run(create_user(
      email="king.arthur@camelot.bt",
      password="guinevere",
      name='AAAAAAAA',
      last_name='BBBBBBBBBBBBBB',
      is_superuser=True,
      profession=1
  ))
