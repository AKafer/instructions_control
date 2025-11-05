import json
import re
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.inspection import inspect

from database.models import Tests, User, Histories, Questions
from web.tests.schemas import TestPassInput


async def update_test_in_db(
    db_session: AsyncSession,
    test: Tests,
    **update_data: dict
) -> Tests:
    for field, value in update_data.items():
        setattr(test, field, value)
    await db_session.commit()
    await db_session.refresh(test)
    return test


def update_question_in_db(
    db_question: Questions,
    **update_data: dict
) -> Questions:
    for field, value in update_data.items():
        setattr(db_question, field, value)
    return db_question


async def calculate_test_result(
    test: Tests,
    input_data: TestPassInput,
    db_session: AsyncSession,
    user: User,
) -> Histories:
    questions_dict = {q.id: q for q in test.questions}
    correct_answers = 0
    instruction = test.instruction
    for journal in instruction.journals:
        if journal.user_uuid == user.id:
            journal = journal
            break

    for user_answer in input_data.user_answers:
        question = questions_dict.get(user_answer.question_id)
        if question.correct_answer == user_answer.answer:
            correct_answers += 1
    rate = round(correct_answers / len(test.questions) * 100, 1)
    passed = rate >= test.success_rate

    history = Histories(
        user_uuid=user.id,
        type=Histories.Type.TEST_EXECUTION,
        journal_id=journal.id,
        date=datetime.utcnow(),
        instruction_id=instruction.id,
        test_id=test.id,
        additional_data={
            'instruction_title': instruction.title,
            'test_title': test.title,
            'rate': rate,
            'success_rate': test.success_rate,
            'passed': passed,
        },
    )
    db_session.add(history)
    await db_session.commit()
    await db_session.refresh(history)
    return history


def sa_to_dict(obj):
    return {c.key: getattr(obj, c.key) for c in inspect(obj).mapper.column_attrs}
