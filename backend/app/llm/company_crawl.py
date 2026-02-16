from pydantic import BaseModel, Field

from app.llm.completion import PromptType, get_completion
from app.models import Company, LLMCost


class SiteSummary(BaseModel):
    company_name: str
    company_description: str = Field(
        ...,
        description="Description of the company, focus on what they do and who they are",
    )
    main_products: list[str] = Field(
        ...,
        description="Main products of the company. "
        "Each product in a format <product_name>: <product_description>",
    )


def serialise_summary(summary: SiteSummary) -> str:
    products = "\n".join([f"- {product}" for product in summary.main_products])
    return f"""
    <company-name>
    {summary.company_name}
    </company-name>
    <company-description>
    {summary.company_description}
    </company-description>
    <main-products>
    {products}
    </main-products>
    """


def serialise_company(company: Company) -> str:
    chunks = []
    if company.name:
        chunks.append(f"<company-name>{company.name}</company-name>")
    if company.description:
        chunks.append(f"<company-description>{company.description}</company-description>")
    if company.products:
        chunks.append(f"<main-products>{company.products}</main-products>")
    if company.website:
        chunks.append(f"<website>{company.website}</website>")
    return "\n".join(chunks)


def create_site_summary(content: str) -> tuple[SiteSummary, LLMCost | None]:
    prompt = f"""
    <instructions>
    You are given website content (raw html) of a company.
    Your goal is to extract information about the company and return it
    in a JSON format following the schema.
    </instructions>
    <website_content>
    {content}
    </website_content>
    """
    summary, cost = get_completion(PromptType.COMPANY_CRAWL, prompt, SiteSummary)
    return summary, cost
