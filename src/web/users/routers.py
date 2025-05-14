import sqlalchemy
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_users import exceptions, models, schemas
from fastapi_users.manager import BaseUserManager
from fastapi_users.router.common import ErrorCode, ErrorModel
from sqlalchemy import select, Delete, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database.models import User, Instructions, Materials
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from web.journals.services import actualize_journals_for_user
from web.users.filters import UsersFilter
from web.users.schemas import (
    UserRead,
    UserUpdate,
    UserListRead,
    AddMaterials,
    Material,
    DeleteMaterials,
)
from web.users.services import peak_personal_journal, merge_additional_features
from web.users.users import (
    current_active_user,
    current_superuser,
    get_user_manager,
)

router = APIRouter(prefix='/users', tags=['users'])


@router.get(
    '/',
    response_model=list[UserListRead],
    dependencies=[Depends(current_superuser)],
)
async def get_all_users(
    user_filter: UsersFilter = Depends(UsersFilter),
    db_session: AsyncSession = Depends(get_db_session),
):
    query = (
        select(User)
        .where(User.is_superuser == False)
        .options(joinedload(User.instructions)
            .joinedload(Instructions.journals)
        )
    )
    query = user_filter.filter(query)
    users = await db_session.execute(query)
    return users.scalars().unique().all()

@router.get(
    '/paginated',
    response_model=Page[UserListRead],
    dependencies=[Depends(current_superuser)],
)
async def get_paginated_users(
    user_filter: UsersFilter = Depends(UsersFilter),
    db_session: AsyncSession = Depends(get_db_session),
):
    # query = select(User).options(
    #     joinedload(User.instructions).joinedload(Instructions.journals)
    # )
    query = select(User).where(User.is_superuser == False)
    query = user_filter.filter(query)
    return await paginate(db_session, query)


async def get_user_or_404(
    request: Request,
    id: str,
    user_manager: BaseUserManager[models.UP, models.ID] = Depends(
        get_user_manager
    ),
) -> models.UP:
    try:
        parsed_id = user_manager.parse_id(id)
        user = await user_manager.get(parsed_id)
        return await peak_personal_journal(request, user)
    except (exceptions.UserNotExists, exceptions.InvalidID) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from e


@router.get(
    '/me',
    response_model=UserRead,
    name='users:current_user',
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            'description': 'Missing token or inactive user.',
        },
    },
)
async def me(
    request: Request,
    user: models.UP = Depends(current_active_user),
):
    user = await peak_personal_journal(request, user)
    return schemas.model_validate(UserRead, user)


@router.get(
    '/{id}',
    response_model=UserRead,
    dependencies=[Depends(current_superuser)],
    name='users:user',
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            'description': 'Missing token or inactive user.',
        },
        status.HTTP_403_FORBIDDEN: {
            'description': 'Not a superuser.',
        },
        status.HTTP_404_NOT_FOUND: {
            'description': 'The user does not exist.',
        },
    },
)
async def get_user(user=Depends(get_user_or_404)):
    return schemas.model_validate(UserRead, user)


@router.patch(
    '/{id}',
    response_model=UserRead,
    dependencies=[Depends(current_superuser)],
    name='users:patch_user',
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            'description': 'Missing token or inactive user.',
        },
        status.HTTP_403_FORBIDDEN: {
            'description': 'Not a superuser.',
        },
        status.HTTP_404_NOT_FOUND: {
            'description': 'The user does not exist.',
        },
        status.HTTP_400_BAD_REQUEST: {
            'model': ErrorModel,
            'content': {
                'application/json': {
                    'examples': {
                        ErrorCode.UPDATE_USER_EMAIL_ALREADY_EXISTS: {
                            'summary': 'A user with this email already exists.',
                            'value': {
                                'detail': ErrorCode.UPDATE_USER_EMAIL_ALREADY_EXISTS
                            },
                        },
                        ErrorCode.UPDATE_USER_INVALID_PASSWORD: {
                            'summary': 'Password validation failed.',
                            'value': {
                                'detail': {
                                    'code': ErrorCode.UPDATE_USER_INVALID_PASSWORD,
                                    'reason': 'Password should be'
                                    'at least 3 characters',
                                }
                            },
                        },
                    }
                }
            },
        },
    },
)
async def update_user(
    user_update: UserUpdate,  # type: ignore
    request: Request,
    user=Depends(get_user_or_404),
    user_manager: BaseUserManager[models.UP, models.ID] = Depends(
        get_user_manager
    ),
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        user_update = await merge_additional_features(user, user_update)
        user = await user_manager.update(
            user_update, user, safe=False, request=request
        )
        await actualize_journals_for_user(user)
        await db_session.refresh(user)
        user = await peak_personal_journal(request, user)
        return schemas.model_validate(UserRead, user)
    except exceptions.InvalidPasswordException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                'code': ErrorCode.UPDATE_USER_INVALID_PASSWORD,
                'reason': e.reason,
            },
        )
    except exceptions.UserAlreadyExists:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=ErrorCode.UPDATE_USER_EMAIL_ALREADY_EXISTS,
        )


@router.delete(
    '/{id}',
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    dependencies=[Depends(current_superuser)],
    name='users:delete_user',
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            'description': 'Missing token or inactive user.',
        },
        status.HTTP_403_FORBIDDEN: {
            'description': 'Not a superuser.',
        },
        status.HTTP_404_NOT_FOUND: {
            'description': 'The user does not exist.',
        },
    },
)
async def delete_user(
    request: Request,
    user=Depends(get_user_or_404),
    user_manager: BaseUserManager[models.UP, models.ID] = Depends(
        get_user_manager
    ),
):
    await user_manager.delete(user, request=request)
    return None


@router.post(
    '/materials/{id}',
    status_code=status.HTTP_201_CREATED,
    response_model=list[Material],
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def add_materials_to_user(
    create_material_input: AddMaterials,
    user=Depends(get_user_or_404),
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        for material in create_material_input.materials:
            material.user_id = user.id
            material = Materials(**material.dict())
            db_session.add(material)
        await db_session.commit()
        query = select(Materials).filter(Materials.user_id == user.id)
        materials = await db_session.execute(query)
        return materials.scalars().all()
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Error while create new materials: {e}',
        )


@router.delete(
    '/materials/{id}',
    status_code=status.HTTP_200_OK,
    response_model=list[Material],
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_materials(
    delete_materials_input: DeleteMaterials,
    user=Depends(get_user_or_404),
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        query = Delete(Materials).filter(
            and_(
                Materials.user_id == user.id,
                Materials.id.in_(delete_materials_input.material_ids),
            )
        )
        await db_session.execute(query)
        await db_session.commit()
        query = select(Materials).filter(Materials.user_id == user.id)
        materials = await db_session.execute(query)
        return materials.scalars().all()
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Error while delete materials: {e}',
        )
