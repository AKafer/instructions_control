from typing import Union, Any

from sqlalchemy.sql import Select
from sqlalchemy.orm import Query as OrmQuery
from fastapi_filter.contrib.sqlalchemy import Filter

from database.models import Journals


class JornalsFilter(Filter):
    actual: bool | None

    @property
    def filtering_fields(self) -> Any:
        fields = self.dict(
            exclude_none=True,
            exclude_unset=True,
            exclude={"actual"},
        )
        fields.pop(self.Constants.ordering_field_name, None)
        return fields.items()

    def filter(self, query: Union[OrmQuery, Select]) -> OrmQuery | Select | None:
        if self.actual is not None:
            query = query.where(self.Constants.model.actual == self.actual)
        return super().filter(query)


    class Constants(Filter.Constants):
        model = Journals