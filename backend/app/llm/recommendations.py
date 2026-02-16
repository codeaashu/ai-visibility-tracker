from pydantic import BaseModel, Field

from app.llm.company_crawl import serialise_company
from app.llm.completion import PromptType, get_completion
from app.models import Company, LLMCost


class RecommendationResponse(BaseModel):
    analysis_steps: list[str] = Field(
        description="Analysis steps you've done to justify your recommendations"
    )
    why_competitor: str = Field(description="Why the competitor is succeeding")
    why_not_user: str = Field(description="Why the user company is not succeeding")
    what_to_do: str = Field(description="Actions for the user company to take")


def generate_recommendation(
    company: Company, competitor_domain: str, problematic_prompts: list[str]
) -> tuple[RecommendationResponse, LLMCost | None]:
    prompt_text = f"""
    <instructions>
    You are provided by a company brief and an website the company want to compete with
    in being recommended by AI chats like ChatGPT, Claude, Gemini, etc.
    It can be either a business competitor or an attention eater.
    You are provided with prompts the user is interested in.
    Explain why the competitor is succeeding, why the company is not, and
    actionable steps that can be taken within 1 month for improvement.
    Return JSON following the schema.
    </instructions>
    <company>
    {serialise_company(company)}
    </company>
    <competitor>
    {competitor_domain}
    </competitor>
    <prompts>
    {"\n".join(f"<prompt>{x}</prompt>" for x in problematic_prompts)}
    </prompts>
    """
    return get_completion(
        PromptType.RECOMMENDATION,
        prompt_text,
        RecommendationResponse,
        allow_search_tools=True,
    )
