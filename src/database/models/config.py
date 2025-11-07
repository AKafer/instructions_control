import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from database.orm import BaseModel
from sqlalchemy.ext.mutable import MutableDict



class Config(BaseModel):
    __tablename__ = 'config'

    id = sa.Column(sa.BigInteger, primary_key=True)
    placeholders = sa.Column(MutableDict.as_mutable(JSONB), default=dict)