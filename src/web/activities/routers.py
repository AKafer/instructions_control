import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models.activities import Activities
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.activities.schemas import (
    Activity,
    ActivityCreateInput,
    ActivityUpdateInput,
)
from web.activities.services import update_activity_db
from web.users.users import current_superuser

router = APIRouter(
    prefix='/activities',
    tags=['activities'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[Activity])
async def get_all_activities(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Activities).order_by(Activities.id.desc())
    activities = await db_session.execute(query)
    return activities.scalars().all()


@router.get(
    '/{activity_id:int}',
    response_model=Activity,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_activity_by_id(
    activity_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Activities).filter(Activities.id == activity_id)
    activity = await db_session.scalar(query)
    if activity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Activity with id {activity_id} not found',
        )
    return activity


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=Activity,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_activity(
    activity_input: ActivityCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        db_activity = Activities(**activity_input.dict())
        db_session.add(db_activity)
        await db_session.commit()
        await db_session.refresh(db_activity)
        return db_activity
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Activity with this title already exists: {e}',
        )


@router.post(
    '/return_list',
    status_code=status.HTTP_201_CREATED,
    response_model=list[Activity],
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_activity_return_list(
    activity_input: ActivityCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        db_activity = Activities(**activity_input.dict())
        db_session.add(db_activity)
        await db_session.commit()
        await db_session.refresh(db_activity)
        query = select(Activities).order_by(Activities.id.desc())
        activities = await db_session.execute(query)
        return activities.scalars().all()
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Activity with this title already exists: {e}',
        )


@router.patch(
    '/{activity_id:int}',
    response_model=Activity,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_activity(
    activity_id: int,
    update_input: ActivityUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Activities).where(Activities.id == activity_id)
    activity = await db_session.scalar(query)
    if activity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Activity with id {activity_id} not found',
        )
    try:
        return await update_activity_db(
            db_session, activity, **update_input.dict(exclude_none=True)
        )
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Activity with this title already exists: {e}',
        )


@router.delete(
    '/{activity_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_activity(
    activity_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Activities).filter(Activities.id == activity_id)
    activity = await db_session.scalar(query)
    if activity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Activity with id {activity_id} not found',
        )
    await db_session.delete(activity)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
