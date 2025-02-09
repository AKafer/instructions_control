import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select, Delete
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models import Norms, NormMaterials
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.norms.schemas import (
    Norm,
    NormCreateInput,
    NormMaterialCreateInput,
    NormUpdateInput,
    NormMaterialList, NormMaterialUpdateInput, NormMaterial,
)
from web.norms.services import update_norm_db, update_norm_material_db
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


@router.get(
    '/{norm_id:int}',
    response_model=Norm,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_norm_by_id(
    norm_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Norms).filter(Norms.id == norm_id)
    norm = await db_session.scalar(query)
    if norm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Norm with id {norm_id} not found',
        )
    return norm


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
    if (
        norm_input.profession_id is not None
        and norm_input.activity_id is not None
    ):
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Error while create new norm: {e}',
        )


@router.patch(
    '/{norm_material_id:int}',
    response_model=NormMaterial,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_norm_material(
    norm_material_id: int,
    update_input: NormMaterialUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(NormMaterials).where(NormMaterials.id == norm_material_id)
    norm_material = await db_session.scalar(query)
    if norm_material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'NormMatrerial with id {norm_material_id} not found',
        )
    try:
        return await update_norm_material_db(
            db_session, norm_material, **update_input.dict(exclude_none=True)
        )
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while updating: {e}',
        )


@router.patch(
    '/{norm_id:int}',
    response_model=Norm,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_norm(
    norm_id: int,
    update_input: NormUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Norms).where(Norms.id == norm_id)
    norm = await db_session.scalar(query)
    if norm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Norm with id {norm} not found',
        )
    try:
        return await update_norm_db(
            db_session, norm, **update_input.dict(exclude_none=True)
        )
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while updating: {e}',
        )


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


@router.delete(
    '/delete_materials/{norm_id:int}',
    status_code=status.HTTP_201_CREATED,
    response_model=Norm,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_materials_from_norm(
    norm_id: int,
    norm_materials: NormMaterialList,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Norms).filter(Norms.id == norm_id)
    norm = await db_session.scalar(query)
    if norm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Norm with id {norm} not found',
        )
    try:
        query = Delete(NormMaterials).filter(
            NormMaterials.id.in_(norm_materials.material_type_ids)
        )
        await db_session.execute(query)
        await db_session.commit()
        await db_session.refresh(norm)
        return norm
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Error while create new norm: {e}',
        )
