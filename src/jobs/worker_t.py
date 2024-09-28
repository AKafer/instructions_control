import asyncio
import logging
import os
import sys
import time
from logging import config as logging_config

from sqlalchemy import select

from database.orm import Session
from database.models import Rules
from settings import LOGGING

logging_config.dictConfig(LOGGING)
logger = logging.getLogger("control")

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


async def get_rules():
    while True:
        async with Session() as session:
            query = select(Rules)
            rules = await session.scalars(query)
            for rule in rules:
                logger.debug(f"Rule: {rule.id} between {rule.profession_id} - {rule.instruction_id}")
            time.sleep(30)


if __name__ == '__main__':
    asyncio.run(get_rules())
