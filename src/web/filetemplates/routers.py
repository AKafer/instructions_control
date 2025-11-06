import io
import logging
import os
import zipfile

from database.models.file_templates import FileTemplates
from dependencies import get_db_session
from fastapi import APIRouter, Depends, File, Request, UploadFile
from main_schemas import ResponseErrorBody
from settings import OUTPUT_DIR, TEMPLATES_DIR
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import Response
from web.filetemplates.schemas import FileTemplate, RequestModel, TemplateCreateInput
from web.filetemplates.services import (
    delete_file,
    delete_files,
    get_full_link,
    run_generated_file,
    save_file, is_allowed_name, rename_old_file, roolback_rename_file,
)
from web.users.users import current_superuser

router = APIRouter(prefix='/file_templates', tags=['file_templates'])
logger = logging.getLogger('control')

@router.get(
    '/',
    status_code=status.HTTP_200_OK,
    response_model=list[FileTemplate],
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def get_all_file_templates(
    request: Request, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(FileTemplates)
    result = await db_session.execute(query)
    templates = result.scalars().all()
    for template in templates:
        template.link = get_full_link(request, template.file_name)
    return templates


@router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=FileTemplate,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def create_file_template(
    request: Request,
    input_data: TemplateCreateInput = Depends(
        TemplateCreateInput.as_form
    ),
    file: UploadFile = File(...),
    db_session: AsyncSession = Depends(get_db_session),
):
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='File must be provided',
        )
    file_name = input_data.title
    if not is_allowed_name(file_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='File name is not allowed',
        )

    query = select(FileTemplates).where(FileTemplates.file_name == file_name)
    result = await db_session.execute(query)
    file_template = result.scalar()
    old_name = None
    if file_template is not None:
        old_name, renamed_count = rename_old_file(file_name)
        if renamed_count != 1 or not old_name:
            logger.warning('Some problems with renaming file %s', file_name)

    try:
        await save_file(file, file_name)
        if not file_template:
            db_file_template = FileTemplates(file_name=file_name)
            db_session.add(db_file_template)
        else:
            db_file_template = file_template
        await db_session.commit()
        await db_session.refresh(db_file_template)
        db_file_template.link = get_full_link(request, file_name)
    except Exception as e:
        logger.error('Error saving file template: %s', e)
        delete_file(file_name)
        roolback_rename_file(file_name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error saving file template: {e}',
        )
    else:
        if old_name:
            delete_file(old_name)

    return db_file_template


@router.delete(
    '/{file_template_id: int}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def delete_file_template(
    file_template_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(FileTemplates).where(FileTemplates.id == file_template_id)
    result = await db_session.execute(query)
    file_template = result.scalar()
    if file_template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'No file template found with id: {file_template_id}',
        )
    delete_file(file_template.file_name)
    query = delete(FileTemplates).where(FileTemplates.id == file_template_id)
    await db_session.execute(query)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    '/generate-docs',
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def generate_docs(request_data: RequestModel):
    memory_buffer = io.BytesIO()
    generated_files = []
    for doc in request_data.documents:
        template_path = os.path.join(TEMPLATES_DIR, doc.template)
        if not os.path.exists(template_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Шаблон {doc.template} не найден',
            )
        output_path = os.path.join(OUTPUT_DIR, doc.template)
        run_generated_file(request_data, doc, template_path, output_path)
        generated_files.append(output_path)

    with zipfile.ZipFile(
        memory_buffer, 'w', compression=zipfile.ZIP_DEFLATED
    ) as zf:
        for file_path in generated_files:
            arcname = os.path.basename(file_path)
            zf.write(file_path, arcname=arcname)

    delete_files(generated_files)
    memory_buffer.seek(0)
    zip_data = memory_buffer.read()

    return Response(
        content=zip_data,
        media_type='application/zip',
        headers={'Content-Disposition': 'attachment; filename=documents.zip'},
    )
