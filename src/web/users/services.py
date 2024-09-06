from fastapi import Request
from fastapi_users import InvalidPasswordException
from sqlalchemy import select

import settings
from database.models import User, Professions, Divisions
from database.orm import Session
from web.instructions.services import get_full_link as get_full_link_ins
from web.journals.services import get_full_link as get_full_link_sign


async def peak_personal_journal(request: Request, user: User) -> User:
    if not user.is_superuser:
        for instruction in user.instructions:
            if instruction.filename is not None:
                instruction.link = get_full_link_ins(
                    request, instruction.filename
                )
            for journal in instruction.journals:
                if journal.user_uuid == user.id:
                    if journal.signature is not None:
                        journal.link = get_full_link_sign(
                            request, journal.signature
                        )
                    instruction.journal = journal
                    break
    return user


async def check_profession_division(user: User) -> None:
    if not user.email == settings.SUPERUSER_EMAIL:
        async with Session() as db_session:
            query = select(Professions).where(Professions.id == user.profession_id)
            profession = await db_session.scalar(query)
            query = select(Divisions).where(Divisions.id == user.division_id)
            division = await db_session.scalar(query)
            if profession is None or division is None:
                raise InvalidPasswordException('Profession or division not found')
