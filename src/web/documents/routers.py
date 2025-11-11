import os

import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select, Delete
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response, JSONResponse, StreamingResponse

from constants import FileTemplatesNamingEnum
from database.models import Documents, Professions
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from externals.http.yandex_llm.yandex_llm_base import LLMResonseError
from externals.http.yandex_llm.yandex_llm_non_qualify_prof_list import NonQualifyProfListClient
from main_schemas import ResponseErrorBody
from settings import TEMPLATES_DIR
from web.documents.schemas import (
    Document,
    CreateDocument,
    UpdateDocument,
    DeleteDocuments,
    ProfessionListInput,
    DownloadProfessionListInput
)

from web.documents.services import (
    check_document_create,
    update_document_db,
    DocumentCreateError,
    generate_doc_non_qualify_prof_list_in_memory
)
from web.users.users import current_superuser

router = APIRouter(
    prefix='/documents',
    tags=['documents'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=list[Document])
async def get_all_documents(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Documents).order_by(Documents.id.desc())
    documents = await db_session.execute(query)
    return documents.scalars().all()


@router.get(
    '/{document_id:int}',
    response_model=Document,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_document_by_id(
    document_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Documents).filter(Documents.id == document_id)
    document = await db_session.scalar(query)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Document with id {document_id} not found',
        )
    return document


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=Document,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_document(
    document_input: CreateDocument,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        await check_document_create(db_session, document_input)
    except DocumentCreateError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    try:
        db_document = Documents(**document_input.dict())
        db_session.add(db_document)
        await db_session.commit()
        await db_session.refresh(db_document)
        return db_document
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while create Document: {e}',
        )


@router.patch(
    '/{document_id:int}',
    response_model=Document,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def update_document(
    document_id: int,
    update_input: UpdateDocument,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Documents).where(Documents.id == document_id)
    document = await db_session.scalar(query)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Document with id {document_id} not found',
        )
    try:
        document = await update_document_db(
            document, **update_input.dict(exclude_none=True)
        )
        await db_session.commit()
        await db_session.refresh(document)
        return document
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unexpected error while update Document: {e}'
        )


@router.delete(
    '/documents/{id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_documents(
    delete_documents_input: DeleteDocuments,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        query = Delete(Documents).filter(
            Documents.id.in_(delete_documents_input.document_ids)
        )
        await db_session.execute(query)
        await db_session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except sqlalchemy.exc.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Error while delete documents: {e}',
        )


@router.post(
    '/non_qualify_prof_list',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_non_qualify_prof_list(
    input_data: ProfessionListInput,
    db_session: AsyncSession = Depends(get_db_session)
):
    client = NonQualifyProfListClient()
    if input_data.all_db_professions:
        query = select(Professions.title)
        result = await db_session.execute(query)
        profession_list = result.scalars().all()
    else:
        if not input_data.profession_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='profession_list must be provided if all_db_professions is False'
            )
        profession_list = input_data.profession_list

    profession_list_str = ', '.join(profession_list)
    content =  (
        f'Список профессий: {profession_list_str}\n\n'
        f'Выбери только те профессии, которые могут быть'
        f' освобождены от первичного инструктажа.'
    )
    print("content:", content)
    try:
        resp = await client.get_llm_answer(content)
        resp['initial_profession_list'] = profession_list
        return JSONResponse(content=resp)
    except LLMResonseError as e:
        raise HTTPException(
            status_code=502,
            detail=f'LLM service error: {e}'
        )


@router.post(
    '/non_qualify_prof_list/download',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def generate_non_qualify_prof_list_document(
    input_data: DownloadProfessionListInput,
):
    filename = None
    for file in os.listdir(TEMPLATES_DIR):
        if file.startswith(
            FileTemplatesNamingEnum.NON_QUALIFY_PROF_LIST.value
        ):
            filename = file
            break

    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Template file for non-qualify profession list not found.'
        )

    template_path = os.path.join(TEMPLATES_DIR, filename)
    try:
        buf = await generate_doc_non_qualify_prof_list_in_memory(
            template_path=template_path,
            professions=input_data.profession_list or []
        )
    except DocumentCreateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

    download_filename = f'{FileTemplatesNamingEnum.NON_QUALIFY_PROF_LIST.value}.docx'
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    headers = {
        'Content-Disposition': f'attachment; filename="{download_filename}"'
    }

    return StreamingResponse(buf, media_type=media_type, headers=headers)
