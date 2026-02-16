from pydantic import BaseModel, Field

from app.llm.company_crawl import SiteSummary, serialise_company, serialise_summary
from app.llm.completion import PromptType, get_completion
from app.models import Company, LLMCost


class Prompts(BaseModel):
    target_audiences: list[str] = Field(
        ...,
        description="Target audiences of the company. Focus on potential customers, "
        "and decision makers.",
    )
    prompts_leading_to_product: list[str] = Field(
        ...,
        description="What prompts target audiences can use with LLMs where company's "
        "product can be the answer. 5-7 questions. One of the questions should "
        "include company name",
    )
    prompts_expertise: list[str] = Field(
        ...,
        description="What prompts target audiences can use with LLMs where company's "
        "expertise (e.g. their blog posts, papers, etc.) can be the answer. "
        "5-7 questions.",
    )


def create_prompts(summary: SiteSummary | Company) -> tuple[Prompts, LLMCost | None]:
    if isinstance(summary, Company):
        data = serialise_company(summary)
    else:
        data = serialise_summary(summary)
    prompt = f"""
    <instructions>
    You are given information about a company, based on their website's main page.
    Your goal is to think in what cases LLM can recommend a product
    or expertise of the company.
    Return results in a JSON format following the schema.
    </instructions>
    <company-data>
    {data}
    </company-data>
    """
    prompts, cost = get_completion(PromptType.PROMPT_SUGGESTIONS, prompt, Prompts)
    assert isinstance(prompts, Prompts)
    return prompts, cost


class PromptList(BaseModel):
    prompts: list[str]


def create_prompts_from_guidance(
    company: Company, guidance: str, limit: int
) -> tuple[list[str], LLMCost | None]:
    data = serialise_company(company)
    prompt = f"""
    <instructions>
    Generate up to {limit} prompts based on provided guidance.
    All prompts should be related to the company's product or expertise.
    Return results in a JSON format following the schema.
    </instructions>
    <company-data>
    {data}
    </company-data>
    <guidance>
    {guidance}
    </guidance>
    """
    res, cost = get_completion(PromptType.PROMPT_SUGGESTIONS, prompt, PromptList)
    assert isinstance(res, PromptList)
    return res.prompts[:limit], cost
