from pydantic import BaseModel


class FileTemplate(BaseModel):
    id: int
    link: str

    class Config:
        orm_mode = True
