from datetime import datetime
from typing import Any

from fastapi import Query
from fastapi_filter.contrib.sqlalchemy import Filter
from pydantic import Field, UUID4
from sqlalchemy import Select
from sqlalchemy.orm import Query as OrmQuery

from database.models import (
    User,
    Divisions,
    Professions,
    Histories,
)


class HistoriesFilter(Filter):
    id__in: list[int] | None = Field(Query(None))
    type__in: list[str] | None = Field(Query(None))
    date__gte: datetime | None = None
    date__lte: datetime | None = None
    instruction_id__in: list[int] | None = Field(Query(None))
    test_id__in: list[int] | None = Field(Query(None))
    user_uuid__in: list[str] | None = Field(Query(None))
    user__division_id__in: list[int] | None = Field(Query(None))
    user__profession_id__in: list[int] | None = Field(Query(None))
    user__last_name__ilike: str | None = None


    class Constants(Filter.Constants):
        model = Histories

    @property
    def filtering_fields(self) -> Any:
        fields = self.dict(
            exclude_none=True,
            exclude_unset=True,
            exclude={
                'user__last_name__ilike',
                'user__division_id__in',
                'user__profession_id__in',
            },
        )
        fields.pop(self.Constants.ordering_field_name, None)
        return fields.items()

    def filter(self, query: OrmQuery | Select):
        if self.user__division_id__in:
            query = self.filter_user__division_id__in(query, self.user__division_id__in)
        if self.user__profession_id__in:
            query = self.filter_user__profession_id__in(query, self.user__profession_id__in)
        if self.user__last_name__ilike:
            query = self.filter_user__last_name__ilike(query, self.user__last_name__ilike)
        return super().filter(query)


    @staticmethod
    def _join_user(query: OrmQuery | Select):
        return query.join(User, Histories.user) if isinstance(query, Select) else query.join(User)

    @staticmethod
    def _join_division(query: OrmQuery | Select):
        q = HistoriesFilter._join_user(query)
        return q.join(Divisions, User.division) if isinstance(q, Select) else q.join(Divisions)

    @staticmethod
    def _join_profession(query: OrmQuery | Select):
        q = HistoriesFilter._join_user(query)
        return q.join(Professions, User.profession) if isinstance(q, Select) else q.join(Professions)

    @staticmethod
    def filter_user__division_id__in(query: OrmQuery | Select, value: list[int] | None):
        if value:
            query = HistoriesFilter._join_user(query)
            query = query.where(User.division_id.in_(value))
        return query

    @staticmethod
    def filter_user__profession_id__in(query: OrmQuery | Select, value: list[int] | None):
        if value:
            query = HistoriesFilter._join_user(query)
            query = query.where(User.profession_id.in_(value))
        return query

    @staticmethod
    def filter_user__last_name__ilike(query: OrmQuery | Select, value: str):
        if value:
            query = HistoriesFilter._join_user(query)
            query = query.where(User.last_name.ilike(f'%{value}%'))
        return query
