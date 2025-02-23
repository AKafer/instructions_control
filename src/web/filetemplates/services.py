import logging
import os

import aiofiles as aiof
from fastapi import Request, UploadFile

from settings import BASE_URL, STATIC_FOLDER, TEMPLATES_DIR, TEMPLATES_FOLDER


logger = logging.getLogger('control')


async def save_file(new_file: UploadFile) -> str:
    filename = new_file.filename
    path_to_file = os.path.join(TEMPLATES_DIR, filename)
    async with aiof.open(path_to_file, 'wb+') as f:
        await f.write(new_file.file.read())
    return filename


def get_full_link(request: Request, filename: str) -> str:
    base_url = BASE_URL or str(request.base_url)
    return f'{base_url}api/{STATIC_FOLDER}/{TEMPLATES_FOLDER}/{filename}'


def delete_file(filename: str) -> None:
    logger.debug(f'Delete file {filename}')
    try:
        os.remove(os.path.join(TEMPLATES_DIR, filename))
    except FileNotFoundError:
        pass