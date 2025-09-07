from typing import Union, Dict

import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from core.simple_cache import Cache
from database.models.material_types import MaterialTypes
from dependencies import get_db_session, get_cache
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.material_types.schemas import (
    MaterialType,
    MaterialTypeCreateInput,
    MaterialTypeUpdateInput, CalculateNeedInput, TableFormat,
)
from web.material_types.services import update_material_type_db, calculate_need_process, calculate_table_process, \
    calculate_need_all_materials_simple
from web.users.users import current_superuser

router = APIRouter(
    prefix='/material_types',
    tags=['material_types'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[MaterialType])
async def get_all_material_types(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(MaterialTypes).order_by(MaterialTypes.id.desc())
    material_types = await db_session.execute(query)
    return material_types.scalars().all()


@router.get(
    '/{material_type_id:int}',
    response_model=MaterialType,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_material_type_by_id(
    material_type_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(MaterialTypes).filter(MaterialTypes.id == material_type_id)
    material_type = await db_session.scalar(query)
    if material_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'MaterialType with id {material_type} not found',
        )
    return material_type


@router.post(
    '/calculate_need/{material_type_id:int}',
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def calculate_need(
    material_type_id: int,
    calculate_input: CalculateNeedInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    return await calculate_need_process(
        db_session,
        material_type_id,
        calculate_input.with_height
    )


@router.get(
    '/calculate_need_all',
    response_model=dict,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def calculate_need_all(
    db_session: AsyncSession = Depends(get_db_session),
    cache: Cache = Depends(get_cache),
):
    return await calculate_need_all_materials_simple(db_session, cache)


@router.post(
    '/calculate_table/{material_type_id:int}',
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def calculate_table(
    material_type_id: int,
    table_format: TableFormat,
    db_session: AsyncSession = Depends(get_db_session),
):
    return await calculate_table_process(
        db_session,
        material_type_id,
        table_format.size_range,
        table_format.height_range,
        table_format.like_file
    )


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=MaterialType,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_material_type(
    material_type_input: MaterialTypeCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        db_material_type = MaterialTypes(**material_type_input.dict())
        db_session.add(db_material_type)
        await db_session.commit()
        await db_session.refresh(db_material_type)
        return db_material_type
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'MaterialType with this title already exists: {e}',
        )


@router.patch(
    '/{material_type_id:int}',
    response_model=MaterialType,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_material_type(
    material_type_id: int,
    update_input: MaterialTypeUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(MaterialTypes).where(MaterialTypes.id == material_type_id)
    material_type = await db_session.scalar(query)
    if material_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'MaterialType with id {material_type_id} not found',
        )
    try:
        return await update_material_type_db(
            db_session, material_type, **update_input.dict(exclude_none=True)
        )
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'MaterialType with this title already exists: {e}',
        )


@router.delete(
    '/{material_type_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_material_type(
    material_type_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(MaterialTypes).filter(MaterialTypes.id == material_type_id)
    material_type = await db_session.scalar(query)
    if material_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'MaterialType with id {material_type_id} not found',
        )
    await db_session.delete(material_type)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
