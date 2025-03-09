from fastapi import APIRouter, Depends
from starlette import status
from web.professions.routers import router as prof_router
from web.instructions.routers import router as ins_router
from web.rules.routers import router as rules_router
from web.users.routers import router as users_router
from web.journals.routers import router as journals_router
from web.divisions.routers import router as divisions_router
from web.tests.routers import router as tests_router
from web.histories.routers import router as histories_router
from web.activities.routers import router as activities_router
from web.material_types.routers import router as material_types_router
from web.norms.routers import router as norms_router
from web.materials.routers import router as materials_router
from web.filetemplates.routers import router as file_templates_router
from web.document_types.routers import router as document_types_router
from web.documents.routers import router as documents_router

from main_schemas import ResponseErrorBody
from web.users.schemas import UserRead, UserCreate
from web.users.users import fastapi_users, auth_backend, current_superuser

api_v1_router = APIRouter(
    prefix='/api/v1',
    dependencies=[],
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            'model': ResponseErrorBody,
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            'model': ResponseErrorBody,
        },
    },
)

api_v1_router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix='/auth/jwt',
    tags=['auth'],
)
api_v1_router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix='/auth',
    tags=['auth'],
    dependencies=[Depends(current_superuser)],
)
api_v1_router.include_router(users_router)
api_v1_router.include_router(journals_router)
api_v1_router.include_router(divisions_router)
api_v1_router.include_router(prof_router)
api_v1_router.include_router(ins_router)
api_v1_router.include_router(rules_router)
api_v1_router.include_router(tests_router)
api_v1_router.include_router(histories_router)
api_v1_router.include_router(activities_router)
api_v1_router.include_router(material_types_router)
api_v1_router.include_router(norms_router)
api_v1_router.include_router(materials_router)
api_v1_router.include_router(file_templates_router)
api_v1_router.include_router(document_types_router)
api_v1_router.include_router(documents_router)


# api_v1_router.include_router(
#     fastapi_users.get_reset_password_router(),
#     prefix="/auth",
#     tags=["auth"],
#     dependencies=[Depends(current_superuser)]
# )

# api_v1_router.include_router(
#     fastapi_users.get_verify_router(UserRead),
#     prefix="/auth",
#     tags=["auth"],
# )

# api_v1_router.include_router(
#     fastapi_users.get_users_router(UserRead, UserUpdate),
#     prefix="/users",
#     tags=["users"],
# )
