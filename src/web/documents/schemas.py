import uuid
from datetime import datetime, date

from pydantic import BaseModel, Extra


class DocumentType(BaseModel):
    id: int
    title: str
    description: str | None
    period: int | None

    class Config:
        orm_mode = True


class User(BaseModel):
    id: uuid.UUID
    name: str
    last_name: str
    division_id: str | None
    profession_id: str | None

    class Config:
        orm_mode = True


class Document(BaseModel):
    id: int
    user: User
    document_type: DocumentType
    start_date: date | None

    class Config:
        orm_mode = True

class CreateDocument(BaseModel):
    user_id: str
    document_type_id: int
    start_date: date | None

    class Config:
        extra = Extra.allow


class UpdateDocument(BaseModel):
    start_date: date | None

    class Config:
        extra = Extra.allow


class DeleteDocuments(BaseModel):
    document_ids: list[int]


class ProfessionListInput(BaseModel):
    profession_list: list | None = None
    all_db_professions: bool | None = False
