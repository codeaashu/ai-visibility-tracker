from pydantic import BaseModel, Field

from app.llm.company_crawl import SiteSummary, serialise_company, serialise_summary
from app.llm.completion import PromptType, get_completion
from app.models import Company, LLMCost


class CompetitorSuggestion(BaseModel):
    name: str = Field(..., description="Competitor company name")
    website: str | None = Field(default=None, description="Competitor website if known")


class CompetitorSuggestions(BaseModel):
    competitors: list[CompetitorSuggestion]


def create_competitors(
    summary: SiteSummary | Company,
) -> tuple[list[CompetitorSuggestion], LLMCost | None]:
    if isinstance(summary, Company):
        data = serialise_company(summary)
    else:
        data = serialise_summary(summary)
    prompt = f"""
    <instructions>
    Given information about a company, suggest up to five direct competitors.
    For each competitor provide a name and, if available, a website URL.
    Return the data in JSON following the schema.
    </instructions>
    <company-data>
    {data}
    </company-data>
    """
    suggestions, cost = get_completion(
        PromptType.COMPETITOR_SUGGESTIONS, prompt, CompetitorSuggestions
    )
    assert isinstance(suggestions, CompetitorSuggestions)
    return suggestions.competitors, cost
