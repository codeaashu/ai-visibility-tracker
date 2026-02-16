from importlib import import_module

from fastapi import APIRouter

from app.settings import settings


def get_api_router() -> APIRouter:
    if settings.license_type == "ee":
        module = import_module("app.api.ee.router")
        return module.get_api_router()
    return import_module("app.api.router").get_api_router()
