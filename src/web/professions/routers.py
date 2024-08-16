from fastapi import APIRouter, Depends
from fastapi_pagination import Page, paginate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models.professions import Professions
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.professions.schemas import Profession, ProfessionCreateInput, ProfessionUpdateInput
from web.professions.services import update_profession
from web.users.users import current_superuser

router = APIRouter(
    prefix="/professions",
    tags=["professions"],
    dependencies=[Depends(current_superuser)]
)


@router.get("/", response_model=list[Profession])
async def get_all_profs(db_session: AsyncSession = Depends(get_db_session)):
    query = select(Professions).order_by(Professions.id.desc())
    professions = await db_session.execute(query)
    return professions.scalars().all()


@router.get(
    "/{profession_id:int}",
    response_model=Profession,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
)
async def get_prof_by_id(
    profession_id: int,
    db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Professions).filter(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profession with id {profession_id} not found",
        )
    return profession


@router.post("/", response_model=Profession)
async def create_prof(
    profession: ProfessionCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    db_profession = Professions(**profession.dict())
    db_session.add(db_profession)
    await db_session.commit()
    await db_session.refresh(db_profession)
    return db_profession


@router.patch(
    "/{profession_id:int}",
    response_model=Profession,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
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
            detail=f"Profession with id {profession_id} not found",
        )
    return await update_profession(
        db_session, profession, **update_input.model_dump(exclude_none=True)
    )


@router.delete(
    "/{profession_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
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
            detail=f"Profession with id {profession_id} not found",
        )
    await db_session.delete(profession)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
