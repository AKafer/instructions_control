import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select, Delete
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models import Materials
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.materials.exceptions import MaterialCreateError
from web.materials.schemas import Material, CreateMaterial, UpdateMaterial, DeleteMaterials, CreateMaterialBulk
from web.materials.services import check_material_create, update_material_db, check_material_bulk_create
from web.users.users import current_superuser

router = APIRouter(
    prefix='/materials',
    tags=['materials'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[Material])
async def get_all_materials(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Materials).order_by(Materials.id.desc())
    materials = await db_session.execute(query)
    return materials.scalars().all()


@router.get(
    '/{material_id:int}',
    response_model=Material,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_material_by_id(
    material_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Materials).filter(Materials.id == material_id)
    material = await db_session.scalar(query)
    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Material with id {material_id} not found',
        )
    return material


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=Material,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_material(
    material_input: CreateMaterial,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        await check_material_create(db_session, material_input)
    except MaterialCreateError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    try:
        db_material = Materials(**material_input.dict())
        db_session.add(db_material)
        await db_session.commit()
        await db_session.refresh(db_material)
        return db_material
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while create Material: {e}',
        )


@router.post(
    '/bulk',
    status_code=status.HTTP_201_CREATED,
    response_model=list[Material],
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_materials(
    material_bulk_input: CreateMaterialBulk,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        verified_material_bulk_input = await check_material_bulk_create(db_session, material_bulk_input)
    except MaterialCreateError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    try:
        list_materials = []
        for material_input in verified_material_bulk_input.materials_data:
            db_material = Materials(
                user_id = verified_material_bulk_input.user_id,
                number_of_document = verified_material_bulk_input.number_of_document,
                **material_input.dict()
            )
            db_session.add(db_material)
            list_materials.append(db_material)
        await db_session.commit()
        for material in list_materials:
            await db_session.refresh(material)
        return list_materials
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while create Material: {e}',
        )


@router.patch(
    '/{material_id:int}',
    response_model=Material,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_material(
    material_id: int,
    update_input: UpdateMaterial,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Materials).where(Materials.id == material_id)
    material = await db_session.scalar(query)
    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Material with id {material_id} not found',
        )
    try:
        material = await update_material_db(
            material, **update_input.dict(exclude_none=True)
        )
        await db_session.commit()
        await db_session.refresh(material)
        return material
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while update Material: {e}'
        )


@router.delete(
    '/materials/{id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_materials(
    delete_materials_input: DeleteMaterials,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        query = Delete(Materials).filter(
            Materials.id.in_(delete_materials_input.material_ids)
        )
        await db_session.execute(query)
        await db_session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Error while delete materials: {e}',
        )
