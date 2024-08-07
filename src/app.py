from fastapi import FastAPI
from fastapi_pagination import add_pagination
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import PlainTextResponse
from starlette.staticfiles import StaticFiles

from routers import api_v1_router


def setup_routes(app: FastAPI):
    app.include_router(api_v1_router)
    app.add_route("/ping/", lambda _request: PlainTextResponse("pong"))


origins = ['*']


def create_app() -> FastAPI:
    app = FastAPI(
        debug=True,
        docs_url="/api/v1/docs",
    )
    setup_routes(app)
    add_pagination(app)
    app.mount("/static", StaticFiles(directory="static"), name="static")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app
