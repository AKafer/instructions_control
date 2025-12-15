import os
from datetime import datetime

import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select, Delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from starlette import status
from starlette.responses import Response, JSONResponse, StreamingResponse

from constants import FileTemplatesNamingEnum
from core.global_placeholders import NON_QUALIFY_PROF, REQUIRING_TRAINING_SIZ
from database.models import (
    Documents,
    Professions,
    User,
    Norms,
    NormMaterials,
    MaterialTypes,
)
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from externals.http.yandex_llm.yandex_llm_base import LLMResonseError
from externals.http.yandex_llm.yandex_llm_ins_generato import (
    InsGeneratorClient,
)
from externals.http.yandex_llm.yandex_llm_non_qualify_prof_list import (
    NonQualifyProfListClient,
)
from externals.http.yandex_llm.yandex_llm_requiring_training_siz_list import (
    RequiringTrainingSIZListClient,
)
from main_schemas import ResponseErrorBody
from settings import TEMPLATES_DIR
from web.documents.schemas import (
    Document,
    CreateDocument,
    UpdateDocument,
    DeleteDocuments,
    ProfessionListInput,
    DownloadProfessionListInput,
    InsGenerateInput,
    InsGenerateSectionsInput,
    PersonalInput,
    OrganizationInput,
    SIZListInput,
    DownloadSizListInput,
)

from web.documents.services import (
    check_document_create,
    update_document_db,
    DocumentCreateError,
    generate_document_in_memory,
    generate_zip_personals_in_memory,
    generate_doc_organization_in_memory,
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
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
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
            detail=f'Unexpected error while update Document: {e}',
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
    db_session: AsyncSession = Depends(get_db_session),
):
    client = NonQualifyProfListClient()
    if input_data.all_db_items:
        query = select(Professions.title)
        result = await db_session.execute(query)
        profession_list = result.scalars().all()
    else:
        if not input_data.profession_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='profession_list must be provided if all_db_professions is False',
            )
        profession_list = input_data.profession_list

    profession_list_str = ', '.join(profession_list)
    content = (
        f'Список профессий: {profession_list_str}\n\n'
        f'Выбери только те профессии, которые могут быть'
        f' освобождены от первичного инструктажа.'
    )
    try:
        resp = await client.get_llm_answer(content)
        resp['initial_profession_list'] = profession_list
        return JSONResponse(content=resp)
    except LLMResonseError as e:
        raise HTTPException(status_code=502, detail=f'LLM service error: {e}')


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
            detail='Template file for non-qualify profession list not found.',
        )

    template_path = os.path.join(TEMPLATES_DIR, filename)
    try:
        buf = await generate_document_in_memory(
            template_path=template_path,
            callback='replace_list_placeholders_in_doc',
            items=input_data.items_list or [],
            placeholder=NON_QUALIFY_PROF,
        )
    except DocumentCreateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

    download_filename = (
        f'{FileTemplatesNamingEnum.NON_QUALIFY_PROF_LIST.value}.docx'
    )
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    headers = {
        'Content-Disposition': f'attachment; filename="{download_filename}"'
    }

    return StreamingResponse(buf, media_type=media_type, headers=headers)


@router.post(
    '/requiring_training_siz_list',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_requiring_training_siz_list(
    input_data: SIZListInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    client = RequiringTrainingSIZListClient()
    if input_data.all_db_items:
        query = select(MaterialTypes.title)
        result = await db_session.execute(query)
        siz_list = result.scalars().all()
    else:
        if not input_data.siz_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='siz_list must be provided if all_db_siz is False',
            )
        siz_list = input_data.siz_list

    siz_list_str = ', '.join(siz_list)
    content = (
        f'Вот перечень средств индивидуальной защиты:\n'
        f'{siz_list_str}\n\n'
        f'Выбери только те СИЗ, применение которых требует практических навыков. '
        f'Не включай простые элементы (например, сигнальные жилеты, белье, очки без особой настройки).'
    )
    try:
        resp = await client.get_llm_answer(content)
        resp['initial_siz_list'] = siz_list
        return JSONResponse(content=resp)
    except LLMResonseError as e:
        raise HTTPException(status_code=502, detail=f'LLM service error: {e}')


@router.post(
    '/requiring_training_siz_list/download',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def generate_requiring_training_siz_list_document(
    input_data: DownloadSizListInput,
):
    filename = None
    for file in os.listdir(TEMPLATES_DIR):
        if file.startswith(
            FileTemplatesNamingEnum.REQUIRING_TRAINING_SIZ_LIST.value
        ):
            filename = file
            break

    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Template file for requiring_training_siz_list not found.',
        )

    template_path = os.path.join(TEMPLATES_DIR, filename)
    try:
        buf = await generate_document_in_memory(
            template_path=template_path,
            callback='replace_list_placeholders_in_doc',
            items=input_data.items_list or [],
            placeholder=REQUIRING_TRAINING_SIZ,
        )
    except DocumentCreateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

    download_filename = (
        f'{FileTemplatesNamingEnum.REQUIRING_TRAINING_SIZ_LIST.value}.docx'
    )
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    headers = {
        'Content-Disposition': f'attachment; filename="{download_filename}"'
    }

    return StreamingResponse(buf, media_type=media_type, headers=headers)


@router.post(
    '/ins_generate',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def ins_generate(input_data: InsGenerateInput):
    client = InsGeneratorClient()
    content = {
        'profession': input_data.profession,
        'description': input_data.description,
        'sizo': ', '.join(input_data.sizo) if input_data.sizo else '',
    }
    try:
        resp = await client.get_llm_answer(content)
        return JSONResponse(content=resp)
    except LLMResonseError as e:
        raise HTTPException(status_code=502, detail=f'LLM service error: {e}')


@router.post(
    '/ins_generate/download',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def ins_generate_document(
    input_data: InsGenerateSectionsInput,
):
    filename = None
    for file in os.listdir(TEMPLATES_DIR):
        if file.startswith(FileTemplatesNamingEnum.IOT_BLANK.value):
            filename = file
            break

    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Template file for non-qualify profession list not found.',
        )

    template_path = os.path.join(TEMPLATES_DIR, filename)
    try:
        buf = await generate_document_in_memory(
            template_path=template_path,
            callback='replace_ins_generate_in_doc',
            sections=input_data.sections.dict(),
            profession=input_data.profession,
        )
    except DocumentCreateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

    download_filename = f'{FileTemplatesNamingEnum.IOT_BLANK.value}.docx'
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    headers = {
        'Content-Disposition': f'attachment; filename="{download_filename}"'
    }

    return StreamingResponse(buf, media_type=media_type, headers=headers)


@router.post(
    '/personal_generate',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def personal_generate(
    input_data: PersonalInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        template = FileTemplatesNamingEnum(input_data.template)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid template value: {input_data.template}',
        )
    if not template.is_in_group('personal'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Template {input_data.template} is not a personal template',
        )

    filename = None
    for file in os.listdir(TEMPLATES_DIR):
        if file.startswith(template.value):
            filename = file
            break

    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Template file for template {input_data.template} not found.',
        )
    template_path = os.path.join(TEMPLATES_DIR, filename)

    options_list = [
        joinedload(User.instructions),
        joinedload(User.division),
        joinedload(User.materials),
    ]

    if template == FileTemplatesNamingEnum.LK_SIZ:
        options_list.append(
            selectinload(User.profession)
            .selectinload(Professions.norm)
            .selectinload(Norms.material_norm_types)
            .selectinload(NormMaterials.material_type)
        )
    else:
        options_list.append(joinedload(User.profession))

    query = (
        select(User)
        .where(
            User.id.in_(input_data.users_uuid_list), User.is_superuser == False
        )
        .options(*options_list)
    )

    result = await db_session.execute(query)
    users_list = result.unique().scalars().all()
    if not users_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='No users found for the provided UUIDs.',
        )

    try:
        buf = await generate_zip_personals_in_memory(
            template=template,
            template_path=template_path,
            users_data=users_list,
            placeholders=input_data.placeholders,
        )
    except DocumentCreateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

    now = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    download_filename = f'{now}-{template.value}.zip'
    media_type = 'application/zip'
    headers = {
        'Content-Disposition': f'attachment; filename="{download_filename}"',
        'Access-Control-Expose-Headers': 'Content-Disposition',
    }
    return StreamingResponse(buf, media_type=media_type, headers=headers)


@router.post(
    '/organization_generate',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def organization_generate(input_data: OrganizationInput):
    try:
        template = FileTemplatesNamingEnum(input_data.template)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid template value: {input_data.template}',
        )
    if not template.is_in_group('organization'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Template {input_data.template} is not a organization template',
        )

    filename = None
    for file in os.listdir(TEMPLATES_DIR):
        if file.startswith(template.value):
            filename = file
            break

    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Template file for template {input_data.template} not found.',
        )
    template_path = os.path.join(TEMPLATES_DIR, filename)

    try:
        buf = await generate_doc_organization_in_memory(
            template=template,
            template_path=template_path,
            placeholders=input_data.placeholders,
        )
    except DocumentCreateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

    now = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    download_filename = f'{now}-{template.value}.docx'
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    headers = {
        'Content-Disposition': f'attachment; filename="{download_filename}"',
        'Access-Control-Expose-Headers': 'Content-Disposition',
    }
    return StreamingResponse(buf, media_type=media_type, headers=headers)
