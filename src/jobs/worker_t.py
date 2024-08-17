import asyncio
import os
import sys
import time

from sqlalchemy import select

from database.orm import Session
from database.models import Rules

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


async def get_rules():
    while True:
        async with Session() as session:
            query = select(Rules)
            rules = await session.scalars(query)
            for rule in rules:
                print(f"Rule: {rule.id} between {rule.profession_id} - {rule.instruction_id}")
            time.sleep(5)


if __name__ == '__main__':
    asyncio.run(get_rules())
