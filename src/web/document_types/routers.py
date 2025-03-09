import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models import DocumentTypes
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.document_types.schemas import DocumentType, DocumentTypeCreateInput, DocumentTypeUpdateInput
from web.document_types.services import update_document_type_db
from web.users.users import current_superuser

router = APIRouter(
    prefix='/document_types',
    tags=['document_types'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[DocumentType])
async def get_all_document_types(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(DocumentTypes).order_by(DocumentTypes.id.desc())
    document_types = await db_session.execute(query)
    return document_types.scalars().all()


@router.get(
    '/{document_type_id:int}',
    response_model=DocumentType,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_document_type_by_id(
    document_type_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(DocumentTypes).filter(DocumentTypes.id == document_type_id)
    document_type = await db_session.scalar(query)
    if document_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'DocumentType with id {document_type} not found',
        )
    return document_type


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=DocumentType,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_document_type(
    document_type_input: DocumentTypeCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        db_document_type = DocumentTypes(**document_type_input.dict())
        db_session.add(db_document_type)
        await db_session.commit()
        await db_session.refresh(db_document_type)
        return db_document_type
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while creating DocumentType: {e}',
        )


@router.patch(
    '/{document_type_id:int}',
    response_model=DocumentType,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_document_type(
    document_type_id: int,
    update_input: DocumentTypeUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(DocumentTypes).where(DocumentTypes.id == document_type_id)
    document_type = await db_session.scalar(query)
    if document_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'DocumentType with id {document_type_id} not found',
        )
    try:
        return await update_document_type_db(
            db_session, document_type, **update_input.dict(exclude_none=True)
        )
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while updating DocumentType: {e}',
        )


@router.delete(
    '/{document_type_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_document_type(
    document_type_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(DocumentTypes).filter(DocumentTypes.id == document_type_id)
    document_type = await db_session.scalar(query)
    if document_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'DocumentType with id {document_type_id} not found',
        )
    await db_session.delete(document_type)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
