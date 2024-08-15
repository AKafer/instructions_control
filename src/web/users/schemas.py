import uuid


from fastapi_users import schemas
from pydantic import EmailStr, Field, BaseModel, ConfigDict
from typing_extensions import Annotated


class UserRead(schemas.BaseUser[uuid.UUID]):
    email: EmailStr
    name: str
    last_name: str
    father_name: str | None
    telegram_id: str | None
    phone_number: str | None
    profession: int | None
    is_active: bool = Field(..., exclude=True)
    is_verified: bool = Field(..., exclude=True)
    is_superuser: bool = Field(..., exclude=True)



class UserCreate(schemas.BaseUserCreate):
    email: EmailStr
    password: str
    name: str
    last_name: str
    father_name: str | None = None
    telegram_id: str | None = None
    phone_number: str | None = None
    profession: int
    # is_active = Annotated[bool, Field(..., exclude=True)]
    # is_verified = Annotated[bool, Field(..., exclude=True)]
    # is_superuser = Annotated[bool, Field(..., exclude=True)]


class UserUpdate(schemas.BaseUserUpdate):
    email: EmailStr | None = None
    password: str | None = None
    name: str | None = None
    last_name: str | None = None
    father_name: str | None = None
    telegram_id: str | None = None
    phone_number: str | None = None
    profession: int | None = None
    # is_active = Annotated[bool, Field(..., exclude=True)]
    # is_verified = Annotated[bool, Field(..., exclude=True)]
    # is_superuser = Annotated[bool, Field(..., exclude=True)]
