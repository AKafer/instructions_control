import uuid
from typing import Optional, Dict, Any

from fastapi import Depends, Request, Response
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, models
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)

from fastapi_users.db import SQLAlchemyUserDatabase

import settings
from database.models.users import User, get_user_db
from web.journals.services import (
    actualize_journals_for_user,
    remove_lines_to_journals_for_delete_user
)

SECRET = settings.SECRET_KEY


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        await actualize_journals_for_user(user)
        print(f"User {user.id} has registered.")

    async def on_after_update(
        self, user: User,
        update_dict: Dict[str, Any],
        request: Optional[Request] = None
    ):
        # actualize in router
        # await actualize_journals_for_user(user)
        print(f"User {user.id} has been updated.")

    async def on_before_delete(self, user: User, request: Optional[Request] = None):
        await remove_lines_to_journals_for_delete_user(user)
        print(f"User {user.id} is going to be deleted")

    async def on_after_login(
        self,
        user: models.UP,
        request: Optional[Request] = None,
        response: Optional[Response] = None,
    ) -> None:
        if user.is_superuser:
            print(f"Superuser {user.id} has logged in.")
        else:
            await actualize_journals_for_user(user)


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_user = fastapi_users.current_user()

current_active_user = fastapi_users.current_user(active=True)

current_superuser = fastapi_users.current_user(superuser=True)
