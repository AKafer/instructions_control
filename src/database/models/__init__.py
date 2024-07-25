__all__ = [
    "BaseModel",
    "Professions",
    "Instructions",
]

from database.orm import BaseModel
from .professions import Professions
from .instructions import Instructions
