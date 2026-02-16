from importlib import import_module
from typing import TYPE_CHECKING

from app.settings import settings

from .company_crawl import CompanyCrawl
from .competitor import Competitor
from .llm_costs import LLMCost
from .monitored_prompt import (
    MonitoredPrompt,
    MonitoredPromptRun,
)
from .recommendation import Recommendation, SQLModel

if TYPE_CHECKING:
    from .company import Company
else:

    def get_company():
        if settings.license_type == "ee":
            import_module("app.models.ee")
            module = import_module("app.models.ee.company")
            return module.Company
        module = import_module("app.models.company")
        return module.Company

    Company = get_company()

__all__ = [
    "MonitoredPrompt",
    "MonitoredPromptRun",
    "Company",
    "Competitor",
    "CompanyCrawl",
    "LLMCost",
    "Recommendation",
    "SQLModel",
]
