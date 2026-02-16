from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import get_api_router
from app.settings import settings

app = FastAPI(
    title=settings.project_name,
    openapi_url=f"{settings.api_v1_str}/openapi.json",
)

allowed_origins = [str(settings.frontend_url)]
if settings.cors_origins:
    allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PermissionError)
async def permission_error_handler(request: Request, exc: PermissionError):
    return JSONResponse(
        status_code=403,
        content={"message": "Permission denied"},
    )


app.include_router(get_api_router(), prefix=settings.api_v1_str)
