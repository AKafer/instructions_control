from fastapi import Query
from fastapi_filter.contrib.sqlalchemy import Filter
from pydantic import Field

from database.models import Rules


class RulesFilter(Filter):
    profession_id__in: list[int] | None = Field(Query(None))
    instruction_id__in: list[int] | None = Field(Query(None))


    class Constants(Filter.Constants):
        model = Rules