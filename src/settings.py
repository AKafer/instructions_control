import os

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static")


BASE_URL = os.getenv("BASE_URL")


DATABASE_POOL_SIZE = os.getenv("DB_POOL_SIZE", default=20)
DATABASE_POOL_MAX_OVERFLOW = os.getenv("DB_POOL_MAX_OVERFLOW", default=5)
DATABASE_HOST = os.getenv("DB_HOST", default="localhost")
DATABASE_PORT = os.getenv("DB_PORT", default=5432)
DATABASE_NAME = os.getenv("POSTGRES_DB", default="")
DATABASE_USER = os.getenv("POSTGRES_USER", default="")
DATABASE_PASSWORD = os.getenv("POSTGRES_PASSWORD", default="")
DATABASE_URL = (
    f"postgresql+asyncpg://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
)

#superuser
SUPERUSER_EMAIL = os.getenv("SUPERUSER_EMAIL")
SUPERUSER_PASSWORD = os.getenv("SUPERUSER_PASSWORD")
SUPERUSER_NAME = os.getenv("SUPERUSER_NAME")
SUPERUSER_LAST_NAME = os.getenv("SUPERUSER_LAST_NAME")
