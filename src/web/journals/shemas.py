from datetime import datetime

from fastapi_users import models
from pydantic import BaseModel, Field

from web.instructions.schemas import Instruction

class Histories(BaseModel):
    id: int
    date: datetime
    user_uuid: models.ID
    link: str | None = None
    signature: str | None = Field(None, exclude=True)

    class Config:
        orm_mode = True


class Journal(BaseModel):
    id: int
    user_uuid: models.ID
    last_date_read: datetime | None
    valid: bool | None = None
    remain_days: int | None = None
    instruction: Instruction
    link: str | None = None
    signature: str | None = Field(None, exclude=True)
    histories: list[Histories]
    actual: bool

    class Config:
        orm_mode = True


class BulkUpdateJournalsInput(BaseModel):
    user_uuids_list: list[str]
    instruction_id: int


class ReportInput(BaseModel):
    instruction_id: int
    profession_id: int | None = None
    user_uuid_list: list[str] | None = None
    with_history: bool = False
    like_file: bool = False
