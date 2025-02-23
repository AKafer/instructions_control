from fastapi import File, UploadFile, APIRouter, Depends, Request
from sqlalchemy import select, delete

from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import Response

from database.models.file_templates import FileTemplates
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from web.filetemplates.schemas import FileTemplate
from web.filetemplates.services import save_file, get_full_link, delete_file

from web.users.users import current_superuser

router = APIRouter(prefix='/file_templates', tags=['file_templates'])


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
    request: Request,
    db_session: AsyncSession = Depends(get_db_session)
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
    file: UploadFile = File(...),
    db_session: AsyncSession = Depends(get_db_session),
):
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='File must be provided',
        )
    file_name = file.filename
    query = select(FileTemplates).where(FileTemplates.file_name==file_name)
    result = await db_session.execute(query)
    file_template = result.scalar()
    if file_template is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='File with such name already exists',
        )
    await save_file(file)
    db_file_template = FileTemplates(file_name=file_name)
    db_session.add(db_file_template)
    await db_session.commit()
    await db_session.refresh(db_file_template)
    db_file_template.link = get_full_link(request, file_name)
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
    file_template_id:int,
    db_session: AsyncSession = Depends(get_db_session)
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
