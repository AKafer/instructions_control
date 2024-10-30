import uuid
from datetime import datetime

from pydantic import BaseModel, Json, conint, Field


class TemplateInput(BaseModel):
    content: list[dict]


class Template(BaseModel):
    id: int
    content: list[dict]

    class Config:
        orm_mode = True


class QuestionCreateInput(BaseModel):
    question: str
    answers: list[dict]
    correct_answer: int
    test_id: int


class Question(BaseModel):
    question: str
    answers: list[dict]
    correct_answer: int
    test_id: int

    class Config:
        orm_mode = True


class TestCreateInput(BaseModel):
    title: str
    description: str | None = None
    success_rate: conint(ge=0, le=100) = Field(
        ...,
        description="Допустимые значения: от 0 до 100"
    )
    instruction_id: int


class TestUpdateInput(BaseModel):
    title: str | None = None
    description: str | None = None
    success_rate: conint(ge=0, le=100) | None = Field(
        None,
        description="Допустимые значения: от 0 до 100"
    )

class QuestionUserAnswers(BaseModel):
    question_id: int
    answer: int


class TestPassInput(BaseModel):
    user_answers: list[QuestionUserAnswers]


class Test(BaseModel):
    id: int
    title: str
    description: str | None = None
    success_rate: int
    instruction_id: int
    questions: list[Question]

    class Config:
        orm_mode = True


class History(BaseModel):
    id: int
    type: str
    user_uuid: str | uuid.UUID
    journal_id: int
    instruction_id: int | None
    test_id: int | None
    date: str | datetime
    signature: str | None
    additional_data: dict

    class Config:
        orm_mode = True
