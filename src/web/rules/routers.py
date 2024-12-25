from fastapi import APIRouter, Depends, Body
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from starlette.responses import Response

from database.models.rules import Rules
from dependencies import get_db_session
from starlette.exceptions import HTTPException

from main_schemas import ResponseErrorBody
from web.exceptions import ItemNotFound, DuplicateError
from web.journals.services import add_lines_to_journals_for_new_rule, remove_lines_to_journals_for_delete_rule
from web.rules.filters import RulesFilter
from web.rules.schemas import Rule, RuleCreateInput
from web.rules.services import check_constraints
from web.users.users import current_superuser

router = APIRouter(prefix="/rules", tags=["rules"], dependencies=[Depends(current_superuser)])


@router.get("/", response_model=list[Rule])
async def get_all_rules(
    rules_filter: RulesFilter = Depends(RulesFilter),
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Rules).order_by(Rules.id.desc())
    query = rules_filter.filter(query)
    rules = await db_session.execute(query)
    return rules.scalars().all()


@router.get(
    "/{rule_id:int}",
    response_model=Rule,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ResponseErrorBody,
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
)
async def get_rule_by_id(
    rule_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Rules).filter(Rules.id == rule_id)
    rule = await db_session.scalar(query)
    if rule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule with id {rule_id} not found",
        )
    return rule


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=Rule
)
async def create_rule(
    rule_input: RuleCreateInput,
    db_session: AsyncSession = Depends(get_db_session),
):
    try:
        await check_constraints(
            db_session,
            rule_input.profession_id,
            rule_input.instruction_id,
        )
    except ItemNotFound as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except DuplicateError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    db_rule = Rules(**rule_input.dict())
    db_session.add(db_rule)
    await db_session.commit()
    await db_session.refresh(db_rule)
    await add_lines_to_journals_for_new_rule(
        db_session, rule_input.profession_id, rule_input.instruction_id)
    return db_rule


@router.patch(
    "/{rule_id:int}",
    response_model=Rule,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
)
async def update_rule(
    rule_id: int,
    description = Body(embed=True),
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Rules).where(Rules.id == rule_id)
    rule = await db_session.scalar(query)
    if rule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule with id {rule_id} not found",
        )
    rule.description = description
    await db_session.commit()
    await db_session.refresh(rule)
    return rule


@router.delete(
    "/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ResponseErrorBody,
        },
    },
)
async def delete_rule(
    rule_id: int,
    db_session: AsyncSession = Depends(get_db_session),
):
    query = select(Rules).filter(Rules.id == rule_id)
    rule = await db_session.scalar(query)
    if rule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule with id {rule_id} not found",
        )
    await remove_lines_to_journals_for_delete_rule(
        db_session, rule.profession_id, rule.instruction_id
    )
    await db_session.delete(rule)
    await db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
