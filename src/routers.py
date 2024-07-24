from fastapi import APIRouter
from starlette import status
from web.professions.routers import router as prof_router

from schemas import ResponseErrorBody

api_v1_router = APIRouter(
    prefix="/api/v1",
    dependencies=[],
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseErrorBody,

        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ResponseErrorBody,
        }
    }
)


api_v1_router.include_router(prof_router)
