from datetime import datetime
from typing import Any, Optional

from fastapi import Query
from fastapi_filter.contrib.sqlalchemy import Filter
from pydantic import Field
from sqlalchemy import Select, func
from sqlalchemy.orm import Query as OrmQuery

from database.models import (
    Materials,
    User,
    Divisions,
    Professions,
    MaterialTypes,
)

class MaterialsFilter(Filter):
    id__in: list[int] | None = Field(Query(None))
    number_of_document__ilike: Optional[str] = None
    sertificate__ilike: Optional[str] = None
    quantity__gte: Optional[int] = None
    quantity__lte: Optional[int] = None
    start_date__gte: Optional[datetime] = None
    start_date__lte: Optional[datetime] = None
    user_id__in: list[str] | None = Field(Query(None))
    material_type_id__in: list[int] | None = Field(Query(None))

    user__name__ilike: Optional[str] = None
    user__division_id__in: list[int] | None = Field(Query(None))
    user__profession_id__in: list[int] | None = Field(Query(None))
    user__last_name__ilike: Optional[str] = None
    user__division__title__ilike: Optional[str] = None
    user__profession__title__ilike: Optional[str] = None
    material_type__title__ilike: Optional[str] = None

    class Constants(Filter.Constants):
        model = Materials

    @property
    def filtering_fields(self) -> Any:
        fields = self.dict(
            exclude_none=True,
            exclude_unset=True,
            exclude={
                'user__name__ilike',
                'user__last_name__ilike',
                'user__division_id__in',
                'user__profession_id__in',
                'user__division__title__ilike',
                'user__profession__title__ilike',
                'material_type__title__ilike',
            },
        )
        fields.pop(self.Constants.ordering_field_name, None)
        return fields.items()

    def filter(self, query: OrmQuery | Select):
        if self.user__last_name__ilike:
            query = self.filter_user__last_name__ilike(query, self.user__last_name__ilike)
        if self.user__name__ilike:
            query = self.filter_user__name__ilike(query, self.user__name__ilike)
        if self.user__division__title__ilike:
            query = self.filter_user__division__title__ilike(query, self.user__division__title__ilike)
        if self.user__profession__title__ilike:
            query = self.filter_user__profession__title__ilike(query, self.user__profession__title__ilike)
        if self.material_type__title__ilike:
            query = self.filter_material_type__title__ilike(query, self.material_type__title__ilike)
        if self.user__division_id__in:
            query = self.filter_user__division_id__in(query, self.user__division_id__in)
        if self.user__profession_id__in:
            query = self.filter_user__profession_id__in(query, self.user__profession_id__in)
        return super().filter(query)

    @staticmethod
    def _join_user(query: OrmQuery | Select):
        return query.join(User, Materials.user) if isinstance(query, Select) else query.join(User)

    @staticmethod
    def _join_division(query: OrmQuery | Select):
        q = MaterialsFilter._join_user(query)
        return q.join(Divisions, User.division) if isinstance(q, Select) else q.join(Divisions)

    @staticmethod
    def _join_profession(query: OrmQuery | Select):
        q = MaterialsFilter._join_user(query)
        return q.join(Professions, User.profession) if isinstance(q, Select) else q.join(Professions)

    @staticmethod
    def _join_material_type(query: OrmQuery | Select):
        return (query.join(MaterialTypes, Materials.material_type)
                if isinstance(query, Select) else query.join(MaterialTypes))

    @staticmethod
    def filter_user__name__ilike(query: OrmQuery | Select, value: str):
        if value:
            query = MaterialsFilter._join_user(query)
            query = query.where(User.name.ilike(f'%{value}%'))
        return query

    @staticmethod
    def filter_user__division_id__in(query: OrmQuery | Select, value: list[int] | None):
        if value:
            query = MaterialsFilter._join_user(query)
            query = query.where(User.division_id.in_(value))
        return query

    @staticmethod
    def filter_user__profession_id__in(query: OrmQuery | Select, value: list[int] | None):
        if value:
            query = MaterialsFilter._join_user(query)
            query = query.where(User.profession_id.in_(value))
        return query

    @staticmethod
    def filter_user__last_name__ilike(query: OrmQuery | Select, value: str):
        if value:
            query = MaterialsFilter._join_user(query)
            query = query.where(User.last_name.ilike(f'%{value}%'))
        return query


    @staticmethod
    def filter_user__division__title__ilike(query: OrmQuery | Select, value: str):
        if value:
            query = MaterialsFilter._join_division(query)
            query = query.where(func.trim(Divisions.title).ilike(f'%{value}%'))
        return query

    @staticmethod
    def filter_user__profession__title__ilike(query: OrmQuery | Select, value: str):
        if value:
            query = MaterialsFilter._join_profession(query)
            query = query.where(func.trim(Professions.title).ilike(f'%{value}%'))
        return query

    @staticmethod
    def filter_material_type__title__ilike(query: OrmQuery | Select, value: str):
        if value:
            query = MaterialsFilter._join_material_type(query)
            query = query.where(MaterialTypes.title.ilike(f'%{value}%'))
        return query
