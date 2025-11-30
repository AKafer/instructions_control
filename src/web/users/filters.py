from datetime import datetime
from typing import Any

from fastapi import Query
from fastapi_filter.contrib.sqlalchemy import Filter
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.sql import Select
from sqlalchemy.orm import Query as OrmQuery

from database.models import User, ActivityRegistry


class UsersFilter(Filter):
    id__in: list[str] | None = Field(Query(None))
    email__ilike: str | None
    name__ilike: str | None
    last_name__ilike: str | None
    telegram_id__ilike: str | None
    phone_number__ilike: str | None
    profession_id__in: list[int] | None = Field(Query(None))
    division_id__in: list[int] | None = Field(Query(None))
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
    activities_id__in: list[int] | None = Field(Query(None))

    class Constants(Filter.Constants):
        model = User
        join_relationships = ["activities"]

    # @staticmethod
    # def filter_activities_id__in(query, value):  # имя = поле фильтра
    #     print('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa')
    #     if value:
    #         query = query.filter(User.activities.any(Activities.id.in_(value)))
    #     return query

    @property
    def filtering_fields(self) -> Any:
        fields = self.dict(
            exclude_none=True,
            exclude_unset=True,
            exclude={
                "activities_id__in"
            },
        )

        fields.pop(self.Constants.ordering_field_name, None)
        return fields.items()

    def filter(self, query: OrmQuery | Select) -> OrmQuery | Select | None:
        if self.activities_id__in is not None:
            users_uuids = (
                select(ActivityRegistry.user_id)
                .where(ActivityRegistry.activity_id.in_(self.activities_id__in))
            )
            query = query.where(
                User.id.in_(users_uuids.subquery())
            )
        return super().filter(query)