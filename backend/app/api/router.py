from fastapi import APIRouter

from app.api.v1.companies import router as companies_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.prompts import router as prompts_router
from app.api.v1.recommendations import router as recommendations_router


def get_api_router() -> APIRouter:
    api_router = APIRouter()
    api_router.include_router(companies_router, prefix="/companies")
    api_router.include_router(prompts_router, prefix="/prompts")
    api_router.include_router(dashboard_router, prefix="/dashboard")
    api_router.include_router(recommendations_router, prefix="/recommendations")
    return api_router
