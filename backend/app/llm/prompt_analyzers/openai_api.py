import json

from openai import OpenAI

from app.llm.prompt_analyzers.helpers import normalize_domain
from app.models import Company, MonitoredPrompt, MonitoredPromptRun
from app.settings import settings


def _get_openai_completion(prompt: str):
    client = OpenAI(api_key=settings.openai_api_key)
    completion = client.chat.completions.create(
        model=settings.api_monitoring_model_openai,
        web_search_options={
            "user_location": {
                "type": "approximate",
                "approximate": {
                    "country": "US",
                },
            },
        },
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )
    return completion.choices[0]


def analyze_prompt(prompt: MonitoredPrompt, company: Company) -> MonitoredPromptRun:
    result = _get_openai_completion(prompt.prompt)
    data = result.model_dump()  # type: ignore
    text = data["message"]["content"]
    brand_names = [company.name, company.name.replace(" ", "")]
    if company.name_aliases:
        brand_names.extend(json.loads(company.name_aliases))
    brand_mentioned = any(name.lower() in text.lower() for name in brand_names)
    domain_normalized = normalize_domain(company.website)
    company_domain_rank = None
    mentioned_pages = []
    for idx, chunk in enumerate(data["message"]["annotations"]):
        # endswith to handle e.g. blog.example.com
        if normalize_domain(chunk["url_citation"]["url"]).endswith(domain_normalized):
            if not company_domain_rank:
                company_domain_rank = idx + 1
        mentioned_pages.append(chunk["url_citation"]["url"])
    domains = [normalize_domain(x["url_citation"]["url"]) for x in data["message"]["annotations"]]
    domains_unique = []
    for domain in domains:  # not via set to preserve order
        if domain not in domains_unique:
            domains_unique.append(domain)
    assert prompt.id is not None
    return MonitoredPromptRun(
        monitored_prompt_id=prompt.id,
        llm_provider="openai",
        llm_model=settings.api_monitoring_model_openai,
        raw_response=json.dumps(data),
        top_domain=domains_unique[0] if domains_unique else None,
        brand_mentioned=brand_mentioned,
        company_domain_rank=company_domain_rank,
        mentioned_pages=json.dumps(mentioned_pages) if mentioned_pages else None,
    )
