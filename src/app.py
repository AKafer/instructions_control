from fastapi import FastAPI
from starlette.responses import PlainTextResponse

from src.routers import api_v1_router


def setup_routes(app: FastAPI):
    app.include_router(api_v1_router)
    app.add_route("/ping/", lambda _request: PlainTextResponse("pong"))


def create_app() -> FastAPI:
    app = FastAPI(
        debug=True,
        docs_url="/api/v1/docs",
    )
    setup_routes(app)
    return app
