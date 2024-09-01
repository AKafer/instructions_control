from fastapi import Request

from database.models import User
from web.instructions.services import get_full_link


async def peak_personal_journal(request: Request, user: User) -> User:
    if not user.is_superuser:
        for instruction in user.instructions:
            if instruction.filename is not None:
                instruction.filename = get_full_link(request, instruction.filename)
            for journal in instruction.journals:
                if journal.user_uuid == user.id:
                    instruction.journal = journal
                    break
    return user