import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models.professions import Professions
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.journals.services import remove_lines_to_journals_for_delete_prof
from web.professions.schemas import (
    Profession,
    ProfessionCreateInput,
    ProfessionUpdateInput,
)
from web.professions.services import update_profession
from web.users.users import current_superuser

router = APIRouter(
    prefix='/professions',
    tags=['professions'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[Profession])
async def get_all_profs(db_session: AsyncSession = Depends(get_db_session)):
    query = select(Professions).order_by(Professions.id.desc())
    professions = await db_session.execute(query)
    return professions.scalars().all()


@router.get(
    '/{profession_id:int}',
    response_model=Profession,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_prof_by_id(
    profession_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Professions).filter(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Profession with id {profession_id} not found',
        )
    return profession


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=Profession,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_prof(
    profession: ProfessionCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        db_profession = Professions(**profession.dict())
        db_session.add(db_profession)
        await db_session.commit()
        await db_session.refresh(db_profession)
        return db_profession
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Profession with this title already exists: {e}',
        )


@router.post(
    '/return_list',
    status_code=status.HTTP_201_CREATED,
    response_model=list[Profession],
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_prof_return_list(
    profession: ProfessionCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        db_profession = Professions(**profession.dict())
        db_session.add(db_profession)
        await db_session.commit()
        await db_session.refresh(db_profession)
        query = select(Professions).order_by(Professions.id.desc())
        professions = await db_session.execute(query)
        return professions.scalars().all()
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Profession with this title already exists: {e}',
        )


@router.patch(
    '/{profession_id:int}',
    response_model=Profession,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_prof(
    profession_id: int,
    update_input: ProfessionUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Professions).where(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Profession with id {profession_id} not found',
        )
    try:
        return await update_profession(
            db_session, profession, **update_input.dict(exclude_none=True)
        )
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Profession with this title already exists: {e}',
        )


@router.delete(
    '/{profession_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_prof(
    profession_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Professions).filter(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Profession with id {profession_id} not found',
        )
    await remove_lines_to_journals_for_delete_prof(db_session, profession_id)
    await db_session.delete(profession)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
