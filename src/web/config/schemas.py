from pydantic import BaseModel


class CreateItemInput(BaseModel):
    item: str
    key: str
    value: str