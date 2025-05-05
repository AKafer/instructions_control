import uuid
import logging
from typing import Optional, Dict, Any, Union, List

import sqlalchemy
from fastapi import Depends, Request, Response, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, models, exceptions
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.jwt import generate_jwt, decode_jwt
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy import select, func

import settings
from database.models.users import User, get_user_db
from database.orm import Session
from web.journals.services import (
    actualize_journals_for_user,
    remove_lines_to_journals_for_delete_user,
)
from web.users.schemas import UserCreate
from web.users.services import check_profession_division

logger = logging.getLogger("control")

SECRET = settings.SECRET_KEY

ACCESS_TTL  = 10
REFRESH_TTL = 60 * 60 * 24 * 14

AUDIENCE: List[str] = ["fastapi-users:auth"]
ALGORITHM = "HS256"


class JWTDecodeError(Exception):
    pass


def build_refresh_token(user: models.UP) -> str:
    payload = {
        "sub": str(user.id),
        "aud": AUDIENCE,
        "type": "refresh",
    }
    return generate_jwt(
        payload,
        SECRET,
        REFRESH_TTL,
        algorithm=ALGORITHM
    )


async def verify_refresh(token: str, user_manager: "UserManager") -> User:
    try:
        data = decode_jwt(
            token,
            SECRET,
            algorithms=[ALGORITHM],
            audience=AUDIENCE,
        )
        if data.get("type") != "refresh":
            raise JWTDecodeError("Not refresh token")

        user_id = uuid.UUID(str(data["sub"]))
    except (JWTDecodeError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    print(f"[refresh] sub from token → {user_id}")

    try:
        parsed_id = user_manager.parse_id(user_id)
        user = await user_manager.get(parsed_id)
        print('user', user)
    except exceptions.UserNotExists:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")

    return user



class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def validate_password(
        self,
        password: str,
        user: Union[UserCreate, User],
    ) -> None:
        await check_profession_division(user)

    async def on_after_register(
        self, user: User, request: Optional[Request] = None
    ):
        await actualize_journals_for_user(user)
        logger.debug(f'User {user.id} has registered.')

    async def on_after_update(
        self,
        user: User,
        update_dict: Dict[str, Any],
        request: Optional[Request] = None,
    ):
        # actualize journals in router
        logger.debug(f'User {user.id} has been updated.')

    async def on_before_delete(
        self, user: User, request: Optional[Request] = None
    ):
        await remove_lines_to_journals_for_delete_user(user)
        logger.debug(f'User {user.id} is going to be deleted')

    async def on_after_login(
        self,
        user: models.UP,
        request: Optional[Request] = None,
        response: Optional[Response] = None,
    ) -> None:
        if user.is_superuser:
            logger.debug(f'Superuser {user.id} has logged in.')
        else:
            await actualize_journals_for_user(user)

        refresh_token = build_refresh_token(user)
        print('refresh_token', refresh_token)
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=REFRESH_TTL,
            httponly=True,
            # samesite="lax",
            samesite = 'none',
            secure = True,
        )


    async def get_by_phone(self, phone: str) -> User:
        query = select(User).where(User.phone_number == phone.lower())
        async with Session() as db_session:
            result = await db_session.execute(query)
            try:
                user = result.unique().scalar_one()
            except sqlalchemy.exc.MultipleResultsFound:
                raise exceptions.UserNotExists()
            if user is None:
                raise exceptions.UserNotExists()
            return user

    async def authenticate(
        self, credentials: OAuth2PasswordRequestForm
    ) -> Optional[models.UP]:
        """
        Authenticate and return a user following an email and a password.

        Will automatically upgrade password hash if necessary.

        :param credentials: The user credentials.
        """
        identifier = credentials.username
        try:
            if "@" in identifier:
                print('EMAIL')
                user = await self.get_by_email(identifier)
            else:
                print('PHONE')
                user = await self.get_by_phone(identifier)
        except exceptions.UserNotExists:
            # Run the hasher to mitigate timing attack
            # Inspired from Django: https://code.djangoproject.com/ticket/20760
            self.password_helper.hash(credentials.password)
            return None

        verified, updated_password_hash = self.password_helper.verify_and_update(
            credentials.password, user.hashed_password
        )
        if not verified:
            return None
        # Update password hash to a more robust one if needed
        if updated_password_hash is not None:
            await self.user_db.update(user, {"hashed_password": updated_password_hash})

        return user




async def get_user_manager(
    user_db: SQLAlchemyUserDatabase = Depends(get_user_db),
):
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl='auth/jwt/login')


class CustomJWTStrategy(JWTStrategy):
    async def write_token(self, user: models.UP) -> str:
        data = {
            "sub": str(user.id),
            "aud": self.token_audience,
            "is_superuser": user.is_superuser,
            'email': user.email,
        }
        return generate_jwt(
            data, self.encode_key, self.lifetime_seconds, algorithm=self.algorithm
        )


def get_jwt_strategy() -> JWTStrategy:
    return CustomJWTStrategy(
        secret=SECRET,
        lifetime_seconds=ACCESS_TTL
    )


auth_backend = AuthenticationBackend(
    name='jwt',
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_user = fastapi_users.current_user()
current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(superuser=True)
