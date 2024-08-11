from fastapi import APIRouter
from starlette import status
from web.professions.routers import router as prof_router
from web.instructions.routers import router as ins_router
from web.rules.routers import router as rules_router

from main_schemas import ResponseErrorBody

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
api_v1_router.include_router(ins_router)
api_v1_router.include_router(rules_router)
