import uuid
from datetime import datetime

from fastapi_users import schemas
from pydantic import EmailStr, Field, BaseModel, ConfigDict
from typing_extensions import Annotated

from web.instructions.schemas import Instruction, InstructionForUser


class UserRead(schemas.BaseUser[uuid.UUID]):
    email: EmailStr
    name: str
    last_name: str
    father_name: str | None
    telegram_id: str | None
    phone_number: str | None
    profession: int | None
    created_at: datetime
    updated_at: datetime | None
    instructions: list[InstructionForUser]
    is_active: bool = Field(True, exclude=True)
    is_verified: bool = Field(False, exclude=True)
    is_superuser: bool = Field(False, exclude=True)


class UserCreate(schemas.BaseUserCreate):
    email: EmailStr
    password: str
    name: str
    last_name: str
    father_name: str | None = None
    telegram_id: str | None = None
    phone_number: str | None = None
    profession: int
    is_active: bool = Field(True, exclude=True)
    is_verified: bool = Field(False, exclude=True)
    is_superuser: bool = Field(False, exclude=True)


class UserUpdate(schemas.BaseUserUpdate):
    email: EmailStr | None = None
    password: str | None = None
    name: str | None = None
    last_name: str | None = None
    father_name: str | None = None
    telegram_id: str | None = None
    phone_number: str | None = None
    profession: int | None = None
    is_active: bool = Field(True, exclude=True)
    is_verified: bool = Field(False, exclude=True)
    is_superuser: bool = Field(False, exclude=True)
