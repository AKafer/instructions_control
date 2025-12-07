from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse

from database.models import Config
from dependencies import get_db_session
from main_schemas import ResponseErrorBody
from web.config.schemas import CreateItemInput
from web.users.users import current_superuser


router = APIRouter(
    prefix='/config',
    tags=['config'],
    dependencies=[Depends(current_superuser)],
)


@router.get('/', response_model=None)
async def get_all_divisions(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Config).where(Config.id == 1)
    config = await db_session.scalar(query)
    resp = config.placeholders if config and config.placeholders else {}
    return JSONResponse(content=resp)


@router.post(
    '/item',
    status_code=status.HTTP_200_OK,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def create_item(
    input_data: CreateItemInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = await db_session.execute(select(Config).where(Config.id == 1))
    config = query.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail='Config not found')
    placeholders = config.placeholders if config.placeholders else {}
    global_placeholders = placeholders.get('global_placeholders', {})
    global_placeholders[input_data.item] = {
        'key': input_data.key,
        'value': input_data.value,
    }
    placeholders['global_placeholders'] = global_placeholders
    config.placeholders = placeholders
    await db_session.commit()
    return JSONResponse(
        content={'message': 'Item created/updated successfully'}
    )


@router.delete(
    '/item/{item:str}',
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
    },
)
async def delete_item(
    item: str,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = await db_session.execute(select(Config).where(Config.id == 1))
    config = query.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail='Config not found')

    placeholders = config.placeholders if config.placeholders else {}
    global_placeholders = placeholders.get('global_placeholders', {})
    if item in global_placeholders:
        del global_placeholders[item]

    i = 0
    sorted_global_placeholders = {}
    for key, value in global_placeholders.items():
        i += 1
        sorted_global_placeholders[str(i)] = value

    config.placeholders['global_placeholders'] = sorted_global_placeholders
    config.placeholders = placeholders
    await db_session.commit()
