import os
from datetime import datetime

import sqlalchemy
from database.models import Documents, NormMaterials, Norms, Professions, User
from dependencies import get_db_session
from externals.http.yandex_llm.yandex_llm_base import LLMResonseError
from fastapi import APIRouter, Depends
from main_schemas import ResponseErrorBody
from settings import TEMPLATES_DIR
from sqlalchemy import Delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse, Response, StreamingResponse
from templates_config import (
    MODEL_MAPPING,
    TEMPLATE_MAPPING,
    FileTemplatesNamingEnum,
    TemplateRegistry,
)
from web.documents.placeholders_funcs import DocumentCreateError
from web.documents.schemas import (
    CreateDocument,
    DeleteDocuments,
    Document,
    DownloadItemListInput,
    GenerateSectionsDownloadInput,
    ItemListInput,
    OrganizationInput,
    PersonalInput,
    SectionsDataInput,
    UpdateDocument,
)
from web.documents.services import (
    add_shoe_size_profs,
    check_document_create,
    generate_doc_organization_in_memory,
    generate_document_in_memory,
    generate_zip_personals_in_memory,
    update_document_db,
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
    '/get_items/{item_name}/{template_name}',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_items_list(
    item_name: str,
    template_name: str,
    input_data: ItemListInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    if item_name not in MODEL_MAPPING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid item name: {item_name}',
        )

    if template_name not in TEMPLATE_MAPPING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid template name: {template_name}',
        )

    if input_data.all_db_items:
        model = MODEL_MAPPING[item_name]
        if model is not None:
            query = select(model.title)
            result = await db_session.execute(query)
            items_list = result.scalars().all()
        else:
            items_list = []
    else:
        if not input_data.items_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='profession_list must be provided if all_db_professions is False',
            )
        items_list = input_data.items_list

    items_list_str = ', '.join(items_list)
    content = TEMPLATE_MAPPING[template_name]['content'].format(
        items_list_str=items_list_str
    )
    client_class = TEMPLATE_MAPPING[template_name]['client_class']
    client = client_class(search_index=input_data.search_index)
    try:
        resp = await client.get_llm_answer(content)
        resp['initial_items'] = items_list
        if template_name == 'norms_dsiz_issuance':
            resp = await add_shoe_size_profs(resp)
        return JSONResponse(content=resp)
    except LLMResonseError as e:
        raise HTTPException(status_code=502, detail=f'LLM service error: {e}')


@router.post(
    '/download_items/{template_name}',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def generate_items_list_document(
    template_name: str,
    input_data: DownloadItemListInput,
):
    try:
        prefix = FileTemplatesNamingEnum(template_name).value
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid template name: {template_name}',
        )
    filename = next(
        (f for f in os.listdir(TEMPLATES_DIR) if f.startswith(prefix)),
        None,
    )

    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Template file for items list not found.',
        )

    template_path = os.path.join(TEMPLATES_DIR, filename)
    try:
        buf = await generate_document_in_memory(
            template_path=template_path,
            callback=TEMPLATE_MAPPING[template_name]['callback'],
            items=input_data.items_list or [],
            placeholder=TEMPLATE_MAPPING[template_name]['placeholder'],
        )
    except DocumentCreateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

    download_filename = f'{prefix}.docx'
    media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    headers = {
        'Content-Disposition': f'attachment; filename="{download_filename}"'
    }

    return StreamingResponse(buf, media_type=media_type, headers=headers)


@router.post(
    '/sections_generate/{template_name}',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def sections_generate(template_name: str, input_data: SectionsDataInput):
    if template_name not in TEMPLATE_MAPPING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid template name: {template_name}',
        )

    client_class = TEMPLATE_MAPPING[template_name]['client_class']
    client = client_class(search_index=input_data.search_index)
    content_values = TEMPLATE_MAPPING[template_name]['content']
    content = {key: getattr(input_data, key) for key in content_values}
    try:
        resp = await client.get_llm_answer(content)
        return JSONResponse(content=resp)
    except LLMResonseError as e:
        raise HTTPException(status_code=502, detail=f'LLM service error: {e}')


@router.post(
    '/download_sections_document/{template_name}',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def download_sections_document(
    template_name: str,
    input_data: GenerateSectionsDownloadInput,
):
    try:
        prefix = FileTemplatesNamingEnum(template_name).value
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid template name: {template_name}',
        )
    filename = next(
        (f for f in os.listdir(TEMPLATES_DIR) if f.startswith(prefix)),
        None,
    )

    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Template file for items list not found.',
        )

    template_path = os.path.join(TEMPLATES_DIR, filename)
    try:
        buf = await generate_document_in_memory(
            template_path=template_path,
            callback='replace_sections_generate_in_doc',
            sections=input_data.sections,
            profession=input_data.profession,
        )
    except DocumentCreateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

    download_filename = f'{template_name}.docx'
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
    if not TemplateRegistry.is_in_group(template.value, 'personal'):
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
    if not TemplateRegistry.is_in_group(template.value, 'organization'):
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
