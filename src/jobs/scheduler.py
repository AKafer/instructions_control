from sqlalchemy import select

from database.models import Rules
from database.orm import Session


async def inspect_rules() -> None:
    print("Running cleaner")
    async with Session() as session:
        query = select(Rules)
        rules = await session.scalars(query)
        for rule in rules:
            print(f"Rule: {rule.id} between {rule.profession_id} - {rule.instruction_id}")