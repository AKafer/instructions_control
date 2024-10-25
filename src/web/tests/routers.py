import sqlalchemy
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models.tests import Templates
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.tests.schemas import TemplateInput, Template
from web.users.users import current_superuser

router = APIRouter(
    prefix='/tests',
    tags=['tests'],
    dependencies=[Depends(current_superuser)],
)



@router.get(
    '/templates/{template_id:int}',
    response_model=Template,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def get_template_by_id(
    template_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Templates).filter(Templates.id == template_id)
    template = await db_session.scalar(query)
    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Template with id {template_id} not found',
        )
    return template


@router.post(
    '/templates/',
    response_model=Template,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_template(
    input_data: TemplateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    db_template = Templates(**input_data.dict())
    db_session.add(db_template)
    await db_session.commit()
    await db_session.refresh(db_template)
    return db_template


@router.delete(
    '/templates/{template_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_template(
    template_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Templates).filter(Templates.id == template_id)
    template = await db_session.scalar(query)
    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Template with id {template_id} not found',
        )
    await db_session.delete(template)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
