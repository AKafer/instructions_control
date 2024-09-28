import logging

from sqlalchemy import select
from logging import config as logging_config

from database.models import Rules
from database.orm import Session
from settings import LOGGING

logging_config.dictConfig(LOGGING)
logger = logging.getLogger("control")


async def inspect_rules() -> None:
    logger.debug("Running cleaner")
    async with Session() as session:
        query = select(Rules)
        rules = await session.scalars(query)
        for rule in rules:
            logger.debug(f"Rule: {rule.id} between {rule.profession_id} - {rule.instruction_id}")