from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models import Divisions
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.divisions.schemas import Division, DivisionCreateInput, DivisionUpdateInput
from web.divisions.services import update_division
from web.users.users import current_superuser

router = APIRouter(
    prefix='/divisions',
    tags=['divisions'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[Division])
async def get_all_divisions(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Divisions).order_by(Divisions.id.desc())
    divisions = await db_session.execute(query)
    return divisions.scalars().all()


@router.get(
    '/{division_id:int}',
    response_model=Division,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_division_by_id(
    division_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Divisions).filter(Divisions.id == division_id)
    division = await db_session.scalar(query)
    if division is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Division with id {division_id} not found',
        )
    return division


@router.post('/', response_model=Division)
async def create_division(
    division_input: DivisionCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    db_division = Divisions(**division_input.dict())
    db_session.add(db_division)
    await db_session.commit()
    await db_session.refresh(db_division)
    return db_division


@router.patch(
    '/{division_id:int}',
    response_model=Division,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_division(
    division_id: int,
    update_input: DivisionUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Divisions).where(Divisions.id == division_id)
    division = await db_session.scalar(query)
    if division is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Division with id {division_id} not found',
        )
    return await update_division(
        db_session, division, **update_input.dict(exclude_none=True)
    )


@router.delete(
    '/{division_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_division(
    division_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Divisions).filter(Divisions.id == division_id)
    division = await db_session.scalar(query)
    if division is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Division with id {division_id} not found',
        )
    await db_session.delete(division)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
