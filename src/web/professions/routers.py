from fastapi import APIRouter, Depends
from fastapi_pagination import Page, paginate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from database.models.professions import Professions
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from schemas import ResponseErrorBody
from web.professions.schemas import Profession, ProfessionInput

router = APIRouter(prefix="/professions", tags=["professions"])


@router.get("/", response_model=Page[Profession])
async def get_all_profs(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Professions).order_by(Professions.id.desc())
    professions = await db_session.execute(query)
    return paginate(professions.scalars().all())


@router.get(
    "/{profession_id}",
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
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Professions).filter(Professions.id == profession_id)
    profession = await db_session.scalar(query)
    if profession is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profssion with id {profession_id} not found",
        )
    return profession


@router.post("/", response_model=Profession)
async def create_prof(
    profession: ProfessionInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    db_profession = Professions(**profession.dict())
    db_session.add(db_profession)
    await db_session.commit()
    await db_session.refresh(db_profession)
    return db_profession
