import uuid
from datetime import datetime

from pydantic import BaseModel


class History(BaseModel):
    id: int
    type: str | None
    user_uuid: str | uuid.UUID
    journal_id: int
    instruction_id: int | None
    test_id: int | None
    date: str | datetime
    signature: str | None
    additional_data: dict | None

    class Config:
        orm_mode = True