__all__ = [
    "BaseModel",
    "Professions",
    "Instructions",
    "Rules",
    "User",
]

from database.orm import BaseModel
from .professions import Professions
from .instructions import Instructions
from .rules import Rules
from .users import User
