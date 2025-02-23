import sqlalchemy as sa
from database.orm import BaseModel


class FileTemplates(BaseModel):
    __tablename__ = 'filetemplates'

    id = sa.Column(sa.BigInteger, primary_key=True)
    file_name = sa.Column(sa.String(255), nullable=False, unique=True)
