from enum import Enum
from importlib import import_module

from sqlmodel import Session

from app.models import Company
from app.settings import settings


class QuotaType(Enum):
    PROMPTS = "prompts"
    COMPANIES = "companies"
    RECOMMENDATIONS = "recommendations"
    LLM_CALLS = "llm_calls"


def ensure_quota_available(db: Session, company: Company, quota_type: QuotaType) -> bool:
    if settings.license_type == "ee":
        module = import_module("app.crud.ee.quota")
        return module.ensure_quota_available(db, company, quota_type)
    return True


def increment_quota(db: Session, company: Company, quota_type: QuotaType) -> None:
    if settings.license_type == "ee":
        module = import_module("app.crud.ee.quota")
        module.increment_quota(db, company, quota_type)
