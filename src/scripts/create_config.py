import asyncio
import logging
from logging import config as logging_config

from sqlalchemy import select

import settings
from database.models import Config
from database.orm import Session

logging_config.dictConfig(settings.LOGGING)
logger = logging.getLogger('control')


async def main():
    async with Session() as session:
        query = select(Config).where(Config.id == 1)
        config = await session.scalar(query)
        if config is None:
            config = Config(id=1, placeholders={})
            session.add(config)
            await session.commit()
            await session.refresh(config)
            logger.info(f'Config created')


if __name__ == '__main__':
    asyncio.run(main())
