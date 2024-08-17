import asyncio
import contextlib

from fastapi_users.exceptions import UserAlreadyExists

import settings
from database.models.users import get_user_db
from dependencies import get_db_session
from web.users.schemas import UserCreate
from web.users.users import get_user_manager

get_async_session_context = contextlib.asynccontextmanager(get_db_session)
get_user_db_context = contextlib.asynccontextmanager(get_user_db)
get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)


class SuperUserCreate(UserCreate):
    profession: int | None = None

async def create_user(
    email: str,
    password: str,
    name: str,
    last_name: str,
):
    try:
        async with get_async_session_context() as session:
            async with get_user_db_context(session) as user_db:
                async with get_user_manager_context(user_db) as user_manager:
                    user = await user_manager.create(
                        SuperUserCreate(
                            email=email,
                            password=password,
                            name=name,
                            last_name=last_name,
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
      email=settings.SUPERUSER_EMAIL,
      password=settings.SUPERUSER_PASSWORD,
      name=settings.SUPERUSER_NAME,
      last_name=settings.SUPERUSER_LAST_NAME,
      )
  )
