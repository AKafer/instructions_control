from datetime import datetime

from fastapi import Query
from fastapi_filter.contrib.sqlalchemy import Filter
from pydantic import Field

from database.models import User


class UsersFilter(Filter):
    id__in: list[str] | None = Field(Query(None))
    email__ilike: str | None
    name__ilike: str | None
    last_name__ilike: str | None
    telegram_id__ilike: str | None
    phone_number__ilike: str | None
    profession__in: list[int] | None = Field(Query(None))
    created_at: datetime | None
    created_at__gt: datetime | None
    created_at__gte: datetime | None
    created_at__lt: datetime | None
    created_at__lte: datetime | None
    updated_at: datetime | None
    updated_at__gt: datetime | None
    updated_at__gte: datetime | None
    updated_at__lt: datetime | None
    updated_at__lte: datetime | None

    class Constants(Filter.Constants):
        model = User