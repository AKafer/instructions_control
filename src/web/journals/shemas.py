from datetime import datetime

from fastapi_users import models
from pydantic import BaseModel


class Journal(BaseModel):
    id: int
    user_uuid: models.ID
    instruction_id: int
    last_date_read: datetime
    signature: str | None = None
    valid: bool | None = None
    remain_days: int | None = None

    class Config:
        orm_mode = True
