import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models import Norms, NormMaterials
from database.models.material_types import MaterialTypes
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.norms.schemas import Norm, NormCreateInput, NormMaterialCreateInput, NormMaterial
from web.users.users import current_superuser

router = APIRouter(
    prefix='/norms',
    tags=['norms'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[Norm])
async def get_all_norms(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Norms).order_by(Norms.id.desc())
    norms = await db_session.execute(query)
    return norms.scalars().all()


# @router.get(
#     '/{norm_id:int}',
#     response_model=MaterialType,
#     responses={
#         status.HTTP_400_BAD_REQUEST: {
#             'model': ResponseErrorBody,
#         },
#         status.HTTP_404_NOT_FOUND: {
#             'model': ResponseErrorBody,
#         },
#     },
# )
# async def get_material_type_by_id(
#     material_type_id: int, db_session: AsyncSession = Depends(get_db_session)
# ):
#     query = select(MaterialTypes).filter(MaterialTypes.id == material_type_id)
#     material_type = await db_session.scalar(query)
#     if material_type is None:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f'MaterialType with id {material_type} not found',
#         )
#     return material_type


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=Norm,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_norm(
    norm_input: NormCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    if norm_input.profession_id is None and norm_input.activity_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Profession or Activity id must be provided',
        )
    if norm_input.profession_id is not None and norm_input.activity_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Profession and Activity id cannot be provided together',
        )
    try:
        db_norm = Norms(**norm_input.dict())
        db_session.add(db_norm)
        await db_session.commit()
        await db_session.refresh(db_norm)
        return db_norm
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Error while create new norm: {e}',
        )

@router.post(
    '/add_materials/{norm_id:int}',
    status_code=status.HTTP_201_CREATED,
    response_model=Norm,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def add_materials_to_norm(
    norm_id: int,
    norm_material_input: list[NormMaterialCreateInput],
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        for material in norm_material_input:
            db_material = NormMaterials(**material.dict(), norm_id=norm_id)
            db_session.add(db_material)
            await db_session.commit()
            await db_session.refresh(db_material)
        query = select(Norms).filter(Norms.id == norm_id)
        norm = await db_session.scalar(query)
        return norm
    except sqlalchemy.exc.IntegrityError as e:
        # raise HTTPException(
        #     status_code=status.HTTP_400_BAD_REQUEST,
        #     detail=f'Error while create new norm: {e}',
        # )
        raise e


# @router.patch(
#     '/{material_type_id:int}',
#     response_model=MaterialType,
#     responses={
#         status.HTTP_404_NOT_FOUND: {
#             'model': ResponseErrorBody,
#         },
#     },
# )
# async def update_material_type(
#     material_type_id: int,
#     update_input: MaterialTypeUpdateInput,
#     db_session: AsyncSession = Depends(get_db_session),
# ):
#     query = select(MaterialTypes).where(MaterialTypes.id == material_type_id)
#     material_type = await db_session.scalar(query)
#     if material_type is None:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f'MaterialType with id {material_type_id} not found',
#         )
#     try:
#         return await update_material_type_db(
#             db_session, material_type, **update_input.dict(exclude_none=True)
#         )
#     except sqlalchemy.exc.IntegrityError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f'MaterialType with this title already exists: {e}',
#         )


@router.delete(
    '/{norm_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_norm(
    norm_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Norms).filter(Norms.id == norm_id)
    norm = await db_session.scalar(query)
    if norm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Norm with id {norm} not found',
        )
    await db_session.delete(norm)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
