import uuid
from datetime import datetime

from pydantic import BaseModel, conint, Field


class Template(BaseModel):
    id: int
    content: list[dict]

    class Config:
        orm_mode = True


class Answer(BaseModel):
    id: int
    text: str

    class Config:
        orm_mode = True


class QuestionCreateInput(BaseModel):
    question: str
    answers: list[Answer]
    correct_answer: int
    test_id: int


class BulkCreateQuestionsInput(BaseModel):
    questions: list[QuestionCreateInput]


class Question(BaseModel):
    id: int
    question: str
    answers: list[Answer]
    correct_answer: int
    test_id: int

    class Config:
        orm_mode = True


class TestCreateInput(BaseModel):
    title: str
    description: str | None = None
    success_rate: conint(ge=0, le=100) = Field(
        ..., description='Допустимые значения: от 0 до 100'
    )
    instruction_id: int


class TestUpdateInput(BaseModel):
    title: str | None = None
    description: str | None = None
    success_rate: conint(ge=0, le=100) | None = Field(
        None, description='Допустимые значения: от 0 до 100'
    )


class QuestionUserAnswers(BaseModel):
    question_id: int
    answer: int


class TestPassInput(BaseModel):
    user_answers: list[QuestionUserAnswers]


class Instruction(BaseModel):
    id: int
    title: str
    number: str | None = None
    period: int | None = None
    iteration: bool = False

    class Config:
        orm_mode = True


class Test(BaseModel):
    id: int
    title: str
    description: str | None = None
    success_rate: int
    instruction_id: int
    instruction: Instruction
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


class TestsForUser(Test):
    histories: list[History] = []


class LLM_INPUT_DATA(BaseModel):
    content: str
