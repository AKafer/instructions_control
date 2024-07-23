import os

from dotenv import load_dotenv

load_dotenv()


DATABASE_POOL_SIZE = os.getenv("DB_POOL_SIZE", default=20)
DATABASE_POOL_MAX_OVERFLOW = os.getenv("DB_POOL_MAX_OVERFLOW", default=5)
DATABASE_HOST = os.getenv("DB_HOST", default="localhost")
DATABASE_PORT = os.getenv("DB_PORT", default=5432)
DATABASE_NAME = os.getenv("DB_NAME", default="")
DATABASE_USER = os.getenv("DB_USER", default="")
DATABASE_PASSWORD = os.getenv("DB_PASSWORD", default="")
DATABASE_URL = (
    f"postgresql+asyncpg://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
)
