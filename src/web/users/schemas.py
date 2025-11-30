import uuid
from datetime import datetime, date, time

from fastapi_users import schemas, models
from pydantic import EmailStr, Field, BaseModel, Extra

class Histories(BaseModel):
    id: int
    date: datetime
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
    link: str | None = None
    signature: str | None = Field(None, exclude=True)
    actual: bool
    histories: list[Histories]

    class Config:
        orm_mode = True


class Instruction(BaseModel):
    id: int
    link: str | None = None
    title: str
    number: str | None
    iteration: bool = False
    period: int | None
    filename: str | None = Field(None, exclude=True)
    is_tests_bind: bool = False
    is_modules_bind: bool = False

    class Config:
        orm_mode = True


class InstructionForUser(Instruction):
    journal: Journal | None


class Profession(BaseModel):
    id: int
    title: str

    class Config:
        orm_mode = True


class Activity(BaseModel):
    id: int
    title: str

    class Config:
        orm_mode = True


class Division(BaseModel):
    id: int
    title: str

    class Config:
        orm_mode = True


class AdditionalFeatures(BaseModel):
    gender: str | None
    height: int | None
    clothing_size: int | None
    shoe_size: int | None
    head_size: int | None
    mask_size: int | None
    gloves_size: int | None
    mitten_size: int | None

    class Config:
        extra = Extra.allow


class MaterialType(BaseModel):
    id: int
    title: str
    unit_of_measurement: str

    class Config:
        orm_mode = True


class Material(BaseModel):
    id: int
    material_type: MaterialType
    sertificate: str | None
    start_date: date | None
    period: int | None
    number_of_document: str | None
    quantity: int | None

    class Config:
        orm_mode = True


class CreateMaterial(BaseModel):
    material_type_id: int
    sertificate: str | None
    start_date: date | None
    period: int | None
    size: float | None
    quantity: int | None
    unit_of_measurement: str | None

    class Config:
        extra = Extra.allow


class AddMaterials(BaseModel):
    materials: list[CreateMaterial]


class DeleteMaterials(BaseModel):
    material_ids: list[int]


class UserRead(schemas.BaseUser[uuid.UUID]):
    email: EmailStr
    name: str
    last_name: str
    father_name: str | None
    telegram_id: str | None
    phone_number: str | None
    profession: Profession | None
    division: Division | None
    activities: list[Activity] | None
    created_at: datetime
    updated_at: datetime | None
    instructions: list[InstructionForUser]
    is_active: bool = Field(True, exclude=True)
    is_verified: bool = Field(False, exclude=True)
    is_superuser: bool = Field(False, exclude=True)
    number: str | None
    inn: str | None
    snils: str | None
    date_of_birth: datetime | None
    started_work: datetime | None
    changed_profession: datetime | None
    additional_features: AdditionalFeatures
    materials: list[Material] | None


class CustomDateTime:
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value):
        if isinstance(value, datetime):
            return value

        if isinstance(value, str):
            if 'T' in value:
                try:
                    value = value.rstrip('Z')
                    return datetime.fromisoformat(value)
                except Exception as e:
                    raise ValueError(
                        f'Invalid datetime format: {value}'
                    ) from e
            else:
                try:
                    d = date.fromisoformat(value)
                    return datetime.combine(d, time(9, 0))
                except Exception as e:
                    raise ValueError(f'Invalid date format: {value}') from e

        raise TypeError(f'Expected a string or datetime, got {type(value)}')

    @classmethod
    def __modify_schema__(cls, field_schema: dict) -> None:
        """
        This method updates the JSON schema for the custom field so that
        OpenAPI documentation can correctly represent it.
        """
        field_schema.update(
            type='string',
            format='date-time',
            description=(
                "A datetime string in ISO format. Date-only strings in 'YYYY-MM-DD' format "
                'are also accepted; in that case, the time defaults to 00:00:00.'
            ),
        )


class UserCreate(schemas.BaseUserCreate):
    email: EmailStr
    password: str
    name: str
    last_name: str
    father_name: str | None = None
    telegram_id: str | None = None
    phone_number: str | None = None
    profession_id: int
    division_id: int | None = None
    is_active: bool = Field(True, exclude=True)
    is_verified: bool = Field(False, exclude=True)
    is_superuser: bool = Field(False, exclude=True)
    number: str | None = None
    inn: str | None = None
    snils: str | None = None
    date_of_birth: datetime | None
    started_work: CustomDateTime | None
    changed_profession: CustomDateTime | None
    additional_features: AdditionalFeatures | None


class UserUpdate(schemas.BaseUserUpdate):
    email: EmailStr | None = None
    password: str | None = None
    name: str | None = None
    last_name: str | None = None
    father_name: str | None = None
    telegram_id: str | None = None
    phone_number: str | None = None
    profession_id: int | None = None
    division_id: int | None = None
    is_active: bool = Field(True, exclude=True)
    is_verified: bool = Field(False, exclude=True)
    is_superuser: bool = Field(False, exclude=True)
    number: str | None = None
    inn: str | None = None
    snils: str | None = None
    date_of_birth: datetime | None
    started_work: CustomDateTime | None
    changed_profession: CustomDateTime | None
    additional_features: AdditionalFeatures | None


class InstructionForUserList(BaseModel):
    id: int
    title: str
    number: str | None

    class Config:
        orm_mode = True


class UserListRead(schemas.BaseUser[uuid.UUID]):
    email: EmailStr
    name: str
    last_name: str
    father_name: str | None
    profession_id: int | None
    division_id: int | None
    telegram_id: str | None
    phone_number: str | None
    instructions: list[InstructionForUserList]
    is_active: bool = Field(True, exclude=True)
    is_verified: bool = Field(False, exclude=True)
    is_superuser: bool = Field(False, exclude=True)
    number: str | None
    inn: str | None
    snils: str | None
    date_of_birth: datetime | None
    started_work: datetime | None
    changed_profession: datetime | None
    additional_features: AdditionalFeatures
    materials: list[Material] | None


class UserListReadLight(schemas.BaseUser[uuid.UUID]):
    name: str
    last_name: str
    father_name: str | None
    profession_id: int | None
    division_id: int | None
