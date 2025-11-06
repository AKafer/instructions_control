from fastapi import Form
from pydantic import BaseModel


class TemplateCreateInput(BaseModel):
    title: str

    @classmethod
    def as_form(
            cls,
            title: str = Form(...),

    ):
        return cls(title=title)


class FileTemplate(BaseModel):
    id: int
    file_name: str
    link: str

    class Config:
        orm_mode = True


class DocumentField(BaseModel):
    template: str
    fields: dict[str, str | list[dict[str, str]]]


class RequestModel(BaseModel):
    common_fields: dict[str, str]
    documents: list[DocumentField]

    class Config:
        schema_extra = {
            "example": {
                "common_fields": {
                    "someKey1": "value1",
                    "someKey2": "value2"
                },
                "documents": [
                    {
                        "template": "contract_template.docx",
                        "fields": {
                            "items": [
                                {
                                    "fio": "Иванов Иван Иванович",
                                    "number_tab": "2345",
                                    "title_siz": "Экранирующие перчатки утепленные",
                                    "kol": "3",
                                    "date_to_user": "04-02-2025",
                                    "period": "12"
                                },
                                {
                                    "fio": "Петвов Петр Петрович",
                                    "number_tab": "2345",
                                    "title_siz": "Очки защитные ультрафиолет",
                                    "kol": "3",
                                    "date_to_user": "04-02-2025",
                                    "period": "12"
                                }
                            ],
                        }
                    }
                ]
            }
        }
