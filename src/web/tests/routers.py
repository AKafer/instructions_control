import json
import logging
import re
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.requests import Request
from starlette.responses import Response

from database.models import User, Histories
from database.models.tests import Templates, Tests, Questions
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from externals.http.yandex_llm import YandexLLMClient
from main_schemas import ResponseErrorBody
from web.tests.schemas import (
    Template,
    TestCreateInput,
    Test,
    TestUpdateInput,
    QuestionCreateInput,
    Question,
    TestPassInput,
    History,
    LLM_INPUT_DATA, BulkCreateQuestionsInput, QuestionUpdateInput,
)
from web.tests.services import (
    update_test_in_db,
    calculate_test_result,
    sa_to_dict,
    extract_json_from_text, update_question_in_db,
)
from web.users.users import current_superuser, current_user

router = APIRouter(
    prefix='/tests',
    tags=['tests'],
)

logger = logging.getLogger('control')


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
    dependencies=[Depends(current_superuser)],
)
async def get_template_by_id(
    template_id: int, db_session: AsyncSession = Depends(get_db_session)
):
    query = select(Templates).filter(Templates.id == template_id)
    template = await db_session.scalar(query)
    if template is None:
        logger.error(f'Template with id {template_id} not found')
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
    dependencies=[Depends(current_superuser)],
)
async def create_template(
    request: Request,
    db_session: AsyncSession = Depends(get_db_session),
):
    raw_body = await request.body()
    raw_text = raw_body.decode('utf-8')
    try:
        match = re.search(r'(\[.*?\])', raw_text, re.DOTALL)
        content = match.group(1)
        db_template = Templates(content=json.loads(content))
    except (json.JSONDecodeError, AttributeError) as e:
        logger.error(f'Invalid JSON format: {e}')
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid JSON format',
        )
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
    dependencies=[Depends(current_superuser)],
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


@router.get(
    '/tests',
    response_model=list[Test],
    dependencies=[Depends(current_superuser)],
)
async def get_all_tests(
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Tests).order_by(Tests.id.desc())
    tests = await db_session.execute(query)
    return tests.scalars().all()


@router.get(
    '/tests/{test_id:int}',
    response_model=Test,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_user)],
)
async def get_test_by_id(
    test_id: int,
    db_session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user),
):
    query = select(Tests).filter(Tests.id == test_id)
    test = await db_session.scalar(query)
    if test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Test with id {test_id} not found',
        )
    return test


@router.post(
    '/tests',
    response_model=Test,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def create_test(
    input_data: TestCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    db_test = Tests(**input_data.dict())
    db_session.add(db_test)
    await db_session.commit()
    await db_session.refresh(db_test)
    return db_test


@router.patch(
    '/tests/{test_id:int}',
    response_model=Test,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def update_test(
    test_id: int,
    update_input: TestUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Tests).where(Tests.id == test_id)
    test = await db_session.scalar(query)
    if test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Test with id {test_id} not found',
        )
    return await update_test_in_db(
        db_session, test, **update_input.dict(exclude_none=True)
    )


@router.delete(
    '/tests/{test_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def delete_test(
    test_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Tests).filter(Tests.id == test_id)
    test = await db_session.scalar(query)
    if test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Test with id {test_id} not found',
        )
    await db_session.delete(test)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    '/tests/pass/{test_id:int}',
    response_model=History,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_user)],
)
async def pass_test(
    test_id: int,
    input_data: TestPassInput,
    db_session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user),
):
    query = select(Tests).filter(Tests.id == test_id)
    test = await db_session.scalar(query)
    if test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Test with id {test_id} not found',
        )
    history = await calculate_test_result(test, input_data, db_session, user)
    return history


@router.post(
    '/questions',
    response_model=Question,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def create_question(
    input_data: QuestionCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    db_question = Questions(**input_data.dict())
    db_session.add(db_question)
    await db_session.commit()
    await db_session.refresh(db_question)
    return db_question


@router.post(
    '/questions/bulk_create',
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            'model': ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def create_bulk_questions(
    input_data: BulkCreateQuestionsInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    for q in input_data.questions:
        print(q.question, len(q.answers))
        if not (0 <= q.correct_answer <= len(q.answers)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f'Correct answer index {q.correct_answer} '
                    f'is out of range for question "{q.question}"'
                )
            )

        db_question = Questions(**q.dict())
        db_session.add(db_question)
    await db_session.commit()
    return Response(
        content=f'Created {len(input_data.questions)} questions',
        status_code=status.HTTP_201_CREATED
    )


@router.patch(
    '/questions/{question_id}',
    response_model=Question,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def update_question(
    question_id: int,
    input_data: QuestionUpdateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Questions).filter(Questions.id == question_id)
    question = await db_session.scalar(query)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Test with id {question_id} not found',
        )
    question = update_question_in_db(question, **input_data.dict(exclude_none=True))
    await db_session.commit()
    await db_session.refresh(question)
    return question


@router.delete(
    '/questions/{question_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            'model': ResponseErrorBody,
        },
    },
    dependencies=[Depends(current_superuser)],
)
async def delete_question(
    question_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Questions).filter(Questions.id == question_id)
    question = await db_session.scalar(query)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Test with id {question_id} not found',
        )
    await db_session.delete(question)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    '/get_tests_instruction/{instruction_id:int}',
    response_model=dict,
    dependencies=[Depends(current_user)],
)
async def get_test_instruction(
    instruction_id: int,
    db_session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user),
):
    if user.is_superuser:
        return {}

    tests = (
        (
            await db_session.execute(
                select(Tests)
                .filter(Tests.instruction_id == instruction_id)
                .order_by(Tests.id)
            )
        )
        .scalars()
        .all()
    )

    if not tests:
        return {'data': []}

    histories = (
        (
            await db_session.execute(
                select(Histories)
                .filter(Histories.user_uuid == str(user.id))
                .filter(Histories.test_id.in_([t.id for t in tests]))
            )
        )
        .scalars()
        .all()
    )

    by_test = defaultdict(list)
    for h in histories:
        by_test[h.test_id].append(sa_to_dict(h))

    data = []
    for t in tests:
        td = sa_to_dict(t)
        td['histories'] = by_test.get(t.id, [])
        data.append(td)

    return {'data': data}


@router.post(
    "/llm/questions",
    response_model=dict | list | str,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(current_superuser)],
    openapi_extra={
        "requestBody": {
            "content": {
                "text/plain": {
                    "schema": {"type": "string"}
                }
            }
        }
    }
)
async def create_llm_question(request: Request):
    raw_text = await request.body()
    text =  raw_text.decode("utf-8", errors="ignore").strip()
    if not text:
        raise HTTPException(
            status_code=400,
            detail="Empty request body"
    )

    client = YandexLLMClient()
    resp = await client.get_llm_questions(text)
    if resp.status != 200:
        raise HTTPException(
            status_code=502,
            detail=f'LLM request failed with status {resp.status}: {resp.parsed_response}'
        )
    try:
        text = resp.parsed_response["result"]["alternatives"][0]["message"]["text"]
    except (TypeError, KeyError, IndexError):
        raise HTTPException(
            status_code=502,
            detail=f'Bad LLM response structure {resp.parsed_response}'
        )
    try:
        return extract_json_from_text(text)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f'Failed to parse JSON: {e}'
        )
