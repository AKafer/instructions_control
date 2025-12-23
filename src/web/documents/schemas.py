import uuid
from datetime import date

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


class ItemListInput(BaseModel):
    items_list: list | None = None
    all_db_items: bool | None = False


class DownloadItemListInput(BaseModel):
    items_list: list | None = None


class SectionsDataInput(BaseModel):
    profession: str
    search_index: str | None = None
    description: str | None = None
    sizo: list[str] | None = None
    manager_title: str | None = None
    equipment_hint: str | None = None


class Section(BaseModel):
    title: str
    text: str


class DocSections(BaseModel):
    general: Section | None = None
    before: Section | None = None
    during: Section | None = None
    accidents: Section | None = None
    after: Section | None = None


class InsGenerateSectionsInput(BaseModel):
    profession: str
    sections: DocSections


class SIZListInput(BaseModel):
    siz_list: list | None = None
    all_db_items: bool | None = False


class DownloadSizListInput(BaseModel):
    items_list: list | None = None


class Placeholder(BaseModel):
    key: str
    value: str


class PersonalInput(BaseModel):
    template: str
    users_uuid_list: list[str]
    placeholders: list[Placeholder]


class OrganizationInput(BaseModel):
    template: str
    placeholders: list[Placeholder]
